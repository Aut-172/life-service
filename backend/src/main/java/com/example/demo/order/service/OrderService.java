package com.example.demo.order.service;

import cn.hutool.core.lang.Snowflake;
import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.auth.entity.Merchant;
import com.example.demo.auth.entity.Rider;
import com.example.demo.auth.entity.User;
import com.example.demo.auth.mapper.MerchantMapper;
import com.example.demo.auth.mapper.RiderMapper;
import com.example.demo.common.BusinessException;
import com.example.demo.order.dto.*;
import com.example.demo.order.entity.GroupCoupon;
import com.example.demo.order.entity.OrderItem;
import com.example.demo.order.entity.Orders;
import com.example.demo.order.mapper.GroupCouponMapper;
import com.example.demo.order.mapper.OrderItemMapper;
import com.example.demo.order.mapper.OrdersMapper;
import com.example.demo.user.entity.Cart;
import com.example.demo.user.mapper.CartMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 订单服务
 * 处理结算、支付、取消、完成、订单列表、商家订单管理
 */
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrdersMapper ordersMapper;
    private final OrderItemMapper orderItemMapper;
    private final GroupCouponMapper groupCouponMapper;
    private final MerchantMapper merchantMapper;
    private final RiderMapper riderMapper;
    private final CartMapper cartMapper;

    private final Snowflake snowflake = IdUtil.getSnowflake(1, 1);

    // ==================== 订单状态常量 ====================

    public static final String STATUS_PENDING_PAYMENT = "pending_payment";
    public static final String STATUS_PENDING_ACCEPT = "pending_accept";
    public static final String STATUS_DELIVERING = "delivering";
    public static final String STATUS_COMPLETED = "completed";
    public static final String STATUS_CANCELLED = "cancelled";
    public static final String STATUS_PENDING_USE = "pending_use";

    // ==================== 用户端 API ====================

    /**
     * 获取用户订单列表
     */
    public List<OrderVO> getUserOrders(Long userId) {
        List<Orders> orders = ordersMapper.selectList(
                new LambdaQueryWrapper<Orders>()
                        .eq(Orders::getUserId, userId)
                        .orderByDesc(Orders::getCreateTime)
        );
        return orders.stream().map(this::toOrderVO).collect(Collectors.toList());
    }

    /**
     * 获取订单详情
     */
    public OrderVO getOrderDetail(Long userId, Long orderId) {
        Orders order = ordersMapper.selectOne(
                new LambdaQueryWrapper<Orders>()
                        .eq(Orders::getId, orderId)
                        .eq(Orders::getUserId, userId)
        );
        if (order == null) {
            throw BusinessException.notFound("订单不存在");
        }
        return toOrderVO(order);
    }

    /**
     * 结算下单
     */
    @Transactional
    public OrderVO checkout(Long userId, CheckoutRequest request) {
        // 校验商家
        Merchant merchant = merchantMapper.selectById(request.getMerchantId());
        if (merchant == null) {
            throw BusinessException.notFound("商家不存在");
        }

        // 生成订单号
        String orderNo = generateOrderNo();

        // 创建订单
        Orders order = new Orders();
        order.setOrderNo(orderNo);
        order.setUserId(userId);
        order.setMerchantId(request.getMerchantId());
        order.setType("delivery");
        order.setTotalAmount(request.getTotal());
        order.setActualAmount(request.getTotal().subtract(
                request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO));
        order.setDeliveryFee(request.getDeliveryFee() != null ? request.getDeliveryFee() : BigDecimal.ZERO);
        order.setDiscount(request.getDiscount() != null ? request.getDiscount() : BigDecimal.ZERO);
        order.setStatus(STATUS_PENDING_PAYMENT);
        order.setAddressDetail(request.getAddress());
        order.setCouponId(request.getCouponId());

        ordersMapper.insert(order);

        // 创建订单明细
        if (request.getItems() != null) {
            for (CheckoutRequest.CheckoutItem item : request.getItems()) {
                OrderItem orderItem = new OrderItem();
                orderItem.setOrderId(order.getId());
                orderItem.setProductId(item.getProductId());
                orderItem.setName(item.getName());
                orderItem.setPrice(item.getPrice());
                orderItem.setQuantity(item.getQuantity());
                orderItem.setImage(item.getImage());
                orderItem.setSpecLabel(item.getSpecLabel());
                orderItem.setSubtotal(item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
                orderItem.setReviewed(false);
                orderItemMapper.insert(orderItem);
            }
        }

        // 清空该商家的购物车
        cartMapper.delete(
                new LambdaQueryWrapper<Cart>()
                        .eq(Cart::getUserId, userId)
                        .eq(Cart::getMerchantId, request.getMerchantId())
        );

        return toOrderVO(order);
    }

    /**
     * 取消订单
     */
    @Transactional
    public OrderVO cancelOrder(Long userId, Long orderId) {
        Orders order = ordersMapper.selectOne(
                new LambdaQueryWrapper<Orders>()
                        .eq(Orders::getId, orderId)
                        .eq(Orders::getUserId, userId)
        );
        if (order == null) {
            throw BusinessException.notFound("订单不存在");
        }
        // 只有待支付和待接单状态可以取消
        if (!STATUS_PENDING_PAYMENT.equals(order.getStatus())
                && !STATUS_PENDING_ACCEPT.equals(order.getStatus())) {
            throw BusinessException.badRequest("当前订单状态不允许取消");
        }

        order.setStatus(STATUS_CANCELLED);
        ordersMapper.updateById(order);
        return toOrderVO(order);
    }

    /**
     * 确认收货
     */
    @Transactional
    public OrderVO completeOrder(Long userId, Long orderId) {
        Orders order = ordersMapper.selectOne(
                new LambdaQueryWrapper<Orders>()
                        .eq(Orders::getId, orderId)
                        .eq(Orders::getUserId, userId)
        );
        if (order == null) {
            throw BusinessException.notFound("订单不存在");
        }
        if (!STATUS_DELIVERING.equals(order.getStatus())
                && !STATUS_PENDING_ACCEPT.equals(order.getStatus())) {
            throw BusinessException.badRequest("当前订单状态不允许确认收货");
        }

        order.setStatus(STATUS_COMPLETED);
        order.setCompletedAt(LocalDateTime.now());
        ordersMapper.updateById(order);
        return toOrderVO(order);
    }

    // ==================== 商家端 API ====================

    /**
     * 获取商家订单列表
     */
    public List<OrderVO> getMerchantOrders(Long merchantId) {
        List<Orders> orders = ordersMapper.selectList(
                new LambdaQueryWrapper<Orders>()
                        .eq(Orders::getMerchantId, merchantId)
                        .orderByDesc(Orders::getCreateTime)
        );
        return orders.stream().map(this::toOrderVO).collect(Collectors.toList());
    }

    /**
     * 商家更新订单状态
     */
    @Transactional
    public OrderVO updateMerchantOrder(Long merchantId, Long orderId, MerchantOrderUpdateRequest request) {
        Orders order = ordersMapper.selectOne(
                new LambdaQueryWrapper<Orders>()
                        .eq(Orders::getId, orderId)
                        .eq(Orders::getMerchantId, merchantId)
        );
        if (order == null) {
            throw BusinessException.notFound("订单不存在");
        }

        String newStatus = request.getStatus();
        String currentStatus = order.getStatus();

        // 校验状态流转合法性
        boolean validTransition = false;
        if (STATUS_PENDING_ACCEPT.equals(currentStatus) && "pending_accept".equals(newStatus)) {
            // 商家接单（状态不变，只是确认）
            validTransition = true;
        } else if (STATUS_PENDING_ACCEPT.equals(currentStatus) && STATUS_DELIVERING.equals(newStatus)) {
            // 待接单 → 配送中
            validTransition = true;
        } else if (STATUS_DELIVERING.equals(currentStatus) && STATUS_COMPLETED.equals(newStatus)) {
            // 配送中 → 已完成
            validTransition = true;
        } else if (STATUS_PENDING_ACCEPT.equals(currentStatus) && STATUS_COMPLETED.equals(newStatus)) {
            // 待接单 → 已完成（到店团购核销场景）
            validTransition = true;
        }

        if (!validTransition) {
            throw BusinessException.badRequest("非法的订单状态变更");
        }

        order.setStatus(newStatus);
        if (STATUS_COMPLETED.equals(newStatus)) {
            order.setCompletedAt(LocalDateTime.now());
        }
        ordersMapper.updateById(order);
        return toOrderVO(order);
    }

    // ==================== 私有方法 ====================

    /**
     * 生成订单编号
     */
    private String generateOrderNo() {
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        long id = snowflake.nextId();
        return "ORD" + datePart + String.format("%010d", id % 10000000000L);
    }

    /**
     * 生成团购券
     */
    private void generateGroupCoupons(Orders order) {
        List<OrderItem> items = orderItemMapper.selectList(
                new LambdaQueryWrapper<OrderItem>()
                        .eq(OrderItem::getOrderId, order.getId())
        );
        for (OrderItem item : items) {
            for (int i = 0; i < item.getQuantity(); i++) {
                GroupCoupon coupon = new GroupCoupon();
                coupon.setOrderId(order.getId());
                coupon.setOrderItemId(item.getId());
                coupon.setCode(generateCouponCode());
                coupon.setStatus("pending_use");
                coupon.setExpireAt(LocalDateTime.now().plusDays(30));
                groupCouponMapper.insert(coupon);
            }
        }
    }

    /**
     * 生成6位核销码
     */
    private String generateCouponCode() {
        Random random = new Random();
        return String.format("%06d", random.nextInt(1000000));
    }

    /**
     * 订单实体转 VO
     */
    private OrderVO toOrderVO(Orders order) {
        // 查询商家信息
        String merchantName = "";
        String merchantAvatar = "";
        if (order.getMerchantId() != null) {
            Merchant merchant = merchantMapper.selectById(order.getMerchantId());
            if (merchant != null) {
                merchantName = merchant.getName();
                merchantAvatar = merchant.getAvatar();
            }
        }

        // 查询骑手信息
        String riderName = null;
        String riderPhone = null;
        if (order.getRiderId() != null) {
            Rider rider = riderMapper.selectById(order.getRiderId());
            if (rider != null) {
                riderName = rider.getName();
                riderPhone = rider.getPhone();
            }
        }

        // 查询订单明细
        List<OrderItem> items = orderItemMapper.selectList(
                new LambdaQueryWrapper<OrderItem>()
                        .eq(OrderItem::getOrderId, order.getId())
        );

        List<OrderVO.OrderItemVO> itemVOs = items.stream().map(item ->
                OrderVO.OrderItemVO.builder()
                        .productId(item.getProductId())
                        .name(item.getName())
                        .price(item.getPrice())
                        .quantity(item.getQuantity())
                        .image(item.getImage())
                        .specLabel(item.getSpecLabel())
                        .reviewed(item.getReviewed() != null && item.getReviewed())
                        .build()
        ).collect(Collectors.toList());

        // 已评价的商品ID列表
        List<String> reviewedProductIds = items.stream()
                .filter(i -> i.getReviewed() != null && i.getReviewed())
                .map(i -> String.valueOf(i.getProductId()))
                .collect(Collectors.toList());

        // 构建时间线
        List<OrderVO.TimelineItem> timeline = buildTimeline(order);

        // 状态中文映射
        String statusText = mapStatus(order.getStatus());

        return OrderVO.builder()
                .id(order.getId())
                .orderNo(order.getOrderNo())
                .merchantId(order.getMerchantId())
                .merchant(merchantName)
                .merchantAvatar(merchantAvatar)
                .status(statusText)
                .total(order.getActualAmount())
                .deliveryFee(order.getDeliveryFee())
                .discount(order.getDiscount())
                .eta("预计30分钟送达")
                .createdAt(order.getCreateTime())
                .paidAt(order.getPaidAt())
                .riderId(order.getRiderId())
                .riderName(riderName)
                .riderPhone(riderPhone)
                .address(order.getAddressDetail())
                .items(itemVOs)
                .reviewedProductIds(reviewedProductIds)
                .timeline(timeline)
                .build();
    }

    /**
     * 构建订单时间线
     */
    private List<OrderVO.TimelineItem> buildTimeline(Orders order) {
        List<OrderVO.TimelineItem> timeline = new ArrayList<>();
        String dateFormat = "MM-dd HH:mm";

        // 已下单
        timeline.add(OrderVO.TimelineItem.builder()
                .label("已下单")
                .time(order.getCreateTime().format(DateTimeFormatter.ofPattern(dateFormat)))
                .build());

        // 已支付
        if (order.getPaidAt() != null) {
            timeline.add(OrderVO.TimelineItem.builder()
                    .label("已支付")
                    .time(order.getPaidAt().format(DateTimeFormatter.ofPattern(dateFormat)))
                    .build());
        }

        // 已完成
        if (order.getCompletedAt() != null) {
            timeline.add(OrderVO.TimelineItem.builder()
                    .label("已完成")
                    .time(order.getCompletedAt().format(DateTimeFormatter.ofPattern(dateFormat)))
                    .build());
        }

        // 已取消
        if (STATUS_CANCELLED.equals(order.getStatus())) {
            timeline.add(OrderVO.TimelineItem.builder()
                    .label("已取消")
                    .time(LocalDateTime.now().format(DateTimeFormatter.ofPattern(dateFormat)))
                    .build());
        }

        return timeline;
    }

    /**
     * 状态码转中文
     */
    private String mapStatus(String status) {
        Map<String, String> map = new HashMap<>();
        map.put(STATUS_PENDING_PAYMENT, "待支付");
        map.put(STATUS_PENDING_ACCEPT, "待取餐");
        map.put(STATUS_DELIVERING, "配送中");
        map.put(STATUS_COMPLETED, "已完成");
        map.put(STATUS_CANCELLED, "已取消");
        map.put(STATUS_PENDING_USE, "待使用");
        return map.getOrDefault(status, status);
    }
}
