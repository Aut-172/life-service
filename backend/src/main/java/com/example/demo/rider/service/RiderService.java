package com.example.demo.rider.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.auth.entity.Merchant;
import com.example.demo.auth.entity.Rider;
import com.example.demo.auth.mapper.MerchantMapper;
import com.example.demo.auth.mapper.RiderMapper;
import com.example.demo.common.BusinessException;
import com.example.demo.order.entity.OrderItem;
import com.example.demo.order.entity.Orders;
import com.example.demo.order.mapper.OrderItemMapper;
import com.example.demo.order.mapper.OrdersMapper;
import com.example.demo.rider.dto.RiderTaskUpdateRequest;
import com.example.demo.rider.dto.RiderTaskVO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 骑手服务
 */
@Service
@RequiredArgsConstructor
public class RiderService {

    private final OrdersMapper ordersMapper;
    private final OrderItemMapper orderItemMapper;
    private final MerchantMapper merchantMapper;
    private final RiderMapper riderMapper;

    /**
     * 获取骑手任务列表
     */
    public RiderTaskVO getTasks(Long riderId) {
        // 待抢单：pending_accept 状态且没有 riderId 的订单
        List<Orders> availableOrders = ordersMapper.selectList(
                new LambdaQueryWrapper<Orders>()
                        .eq(Orders::getStatus, "pending_accept")
                        .isNull(Orders::getRiderId)
                        .orderByDesc(Orders::getCreateTime)
        );

        // 进行中：分配给该骑手且状态为 delivering
        List<Orders> assignedOrders = ordersMapper.selectList(
                new LambdaQueryWrapper<Orders>()
                        .eq(Orders::getRiderId, riderId)
                        .eq(Orders::getStatus, "delivering")
                        .orderByDesc(Orders::getCreateTime)
        );

        // 已完成：分配给该骑手且状态为 completed
        List<Orders> completedOrders = ordersMapper.selectList(
                new LambdaQueryWrapper<Orders>()
                        .eq(Orders::getRiderId, riderId)
                        .eq(Orders::getStatus, "completed")
                        .orderByDesc(Orders::getCreateTime)
        );

        // 统计数据
        RiderTaskVO.RiderStats stats = RiderTaskVO.RiderStats.builder()
                .totalEarnings(completedOrders.size() * 5.0) // 模拟每单5元配送费
                .completedOrders(completedOrders.size())
                .totalDistance(completedOrders.size() * 2.0 + "km") // 模拟每单2km
                .build();

        return RiderTaskVO.builder()
                .available(availableOrders.stream().map(this::toTaskItem).collect(Collectors.toList()))
                .assigned(assignedOrders.stream().map(this::toTaskItem).collect(Collectors.toList()))
                .completed(completedOrders.stream().map(this::toTaskItem).collect(Collectors.toList()))
                .stats(stats)
                .build();
    }

    /**
     * 更新骑手任务（接单/已取餐/送达完成）
     */
    @Transactional
    public RiderTaskVO.TaskItem updateTask(Long riderId, Long orderId, RiderTaskUpdateRequest request) {
        Orders order = ordersMapper.selectById(orderId);
        if (order == null) {
            throw BusinessException.notFound("订单不存在");
        }

        String newStatus = request.getStatus();
        String currentStatus = order.getStatus();

        switch (newStatus) {
            case "待取餐":
                // 接单：pending_accept → delivering，设置骑手信息
                if (!"pending_accept".equals(currentStatus)) {
                    throw BusinessException.badRequest("当前订单状态不允许接单");
                }
                if (order.getRiderId() != null) {
                    throw BusinessException.badRequest("该订单已被其他骑手接单");
                }
                order.setRiderId(riderId);
                order.setStatus("delivering");
                break;

            case "配送中":
                // 已取餐：delivering 状态不变，只是标记
                if (!"delivering".equals(currentStatus)) {
                    throw BusinessException.badRequest("当前订单状态不允许标记配送中");
                }
                if (!riderId.equals(order.getRiderId())) {
                    throw BusinessException.badRequest("该订单不是您的配送任务");
                }
                break;

            case "已完成":
                // 送达完成：delivering → completed
                if (!"delivering".equals(currentStatus)) {
                    throw BusinessException.badRequest("当前订单状态不允许确认送达");
                }
                if (!riderId.equals(order.getRiderId())) {
                    throw BusinessException.badRequest("该订单不是您的配送任务");
                }
                order.setStatus("completed");
                order.setCompletedAt(LocalDateTime.now());
                break;

            default:
                throw BusinessException.badRequest("非法的任务状态: " + newStatus);
        }

        ordersMapper.updateById(order);
        return toTaskItem(order);
    }

    /**
     * 将订单转换为骑手任务项
     */
    private RiderTaskVO.TaskItem toTaskItem(Orders order) {
        // 查询商家信息
        String merchantName = "";
        String merchantAvatar = "";
        String merchantAddress = "";
        if (order.getMerchantId() != null) {
            Merchant merchant = merchantMapper.selectById(order.getMerchantId());
            if (merchant != null) {
                merchantName = merchant.getName();
                merchantAvatar = merchant.getAvatar();
                merchantAddress = merchant.getAddress();
            }
        }

        // 查询订单商品摘要
        List<OrderItem> items = orderItemMapper.selectList(
                new LambdaQueryWrapper<OrderItem>()
                        .eq(OrderItem::getOrderId, order.getId())
        );
        String itemsSummary = items.stream()
                .map(item -> item.getName() + "×" + item.getQuantity())
                .collect(Collectors.joining("、"));

        // 状态中文映射
        String statusText;
        switch (order.getStatus()) {
            case "pending_accept":
                statusText = "待取餐";
                break;
            case "delivering":
                statusText = "配送中";
                break;
            case "completed":
                statusText = "已完成";
                break;
            default:
                statusText = order.getStatus();
        }

        return RiderTaskVO.TaskItem.builder()
                .id(order.getId())
                .orderNo(order.getOrderNo())
                .merchant(merchantName)
                .merchantAvatar(merchantAvatar)
                .items(itemsSummary)
                .pickup(merchantAddress)
                .destination(order.getAddressDetail())
                .status(statusText)
                .eta("预计30分钟送达")
                .total(order.getActualAmount() != null ? order.getActualAmount().doubleValue() : 0.0)
                .build();
    }
}
