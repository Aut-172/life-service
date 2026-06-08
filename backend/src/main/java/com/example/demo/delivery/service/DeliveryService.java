package com.example.demo.delivery.service;

import com.example.demo.auth.entity.Merchant;
import com.example.demo.auth.entity.Rider;
import com.example.demo.auth.mapper.MerchantMapper;
import com.example.demo.auth.mapper.RiderMapper;
import com.example.demo.delivery.dto.DeliveryVO;
import com.example.demo.order.entity.Orders;
import com.example.demo.order.mapper.OrdersMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * 配送追踪服务
 */
@Service
public class DeliveryService {

    private final OrdersMapper ordersMapper;
    private final RiderMapper riderMapper;
    private final MerchantMapper merchantMapper;

    public DeliveryService(OrdersMapper ordersMapper, RiderMapper riderMapper, MerchantMapper merchantMapper) {
        this.ordersMapper = ordersMapper;
        this.riderMapper = riderMapper;
        this.merchantMapper = merchantMapper;
    }

    /**
     * 获取配送追踪信息
     *
     * @param orderId 订单ID
     * @return 配送追踪信息
     */
    public DeliveryVO getDeliveryInfo(Long orderId) {
        Orders order = ordersMapper.selectById(orderId);
        if (order == null) {
            return null;
        }

        // 获取骑手信息
        String riderName = null;
        String riderPhone = null;
        if (order.getRiderId() != null) {
            Rider rider = riderMapper.selectById(order.getRiderId());
            if (rider != null) {
                riderName = rider.getName();
                riderPhone = rider.getPhone();
            }
        }

        // 获取商家信息（用于ETA估算）
        Merchant merchant = merchantMapper.selectById(order.getMerchantId());

        // 构建时间线
        List<DeliveryVO.TimelineItem> timeline = buildTimeline(order);

        // 状态映射
        String displayStatus = mapStatus(order.getStatus());

        // ETA 估算
        String eta = estimateEta(order, merchant);

        return DeliveryVO.builder()
                .orderId(order.getId())
                .status(displayStatus)
                .riderName(riderName)
                .riderPhone(riderPhone)
                .eta(eta)
                .timeline(timeline)
                .build();
    }

    /**
     * 构建订单时间线
     */
    private List<DeliveryVO.TimelineItem> buildTimeline(Orders order) {
        List<DeliveryVO.TimelineItem> timeline = new ArrayList<>();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        // 已下单
        if (order.getCreateTime() != null) {
            timeline.add(DeliveryVO.TimelineItem.builder()
                    .label("已下单")
                    .time(order.getCreateTime().format(fmt))
                    .build());
        }

        // 已支付
        if (order.getPaidAt() != null) {
            timeline.add(DeliveryVO.TimelineItem.builder()
                    .label("已支付")
                    .time(order.getPaidAt().format(fmt))
                    .build());
        }

        // 配送中（如果有骑手接单时间，这里简化处理）
        if ("delivering".equals(order.getStatus()) && order.getRiderId() != null) {
            timeline.add(DeliveryVO.TimelineItem.builder()
                    .label("配送中")
                    .time(LocalDateTime.now().format(fmt))
                    .build());
        }

        // 已完成
        if ("completed".equals(order.getStatus()) && order.getCompletedAt() != null) {
            timeline.add(DeliveryVO.TimelineItem.builder()
                    .label("已完成")
                    .time(order.getCompletedAt().format(fmt))
                    .build());
        }

        return timeline;
    }

    /**
     * 估算预计送达时间
     */
    private String estimateEta(Orders order, Merchant merchant) {
        if ("completed".equals(order.getStatus()) || "cancelled".equals(order.getStatus())) {
            return null;
        }

        if ("delivering".equals(order.getStatus())) {
            return "约15-30分钟";
        }

        if ("pending_accept".equals(order.getStatus())) {
            return "等待商家接单";
        }

        if ("pending_payment".equals(order.getStatus())) {
            return "等待支付";
        }

        return null;
    }

    /**
     * 状态映射
     */
    private String mapStatus(String status) {
        if (status == null) return "未知";
        switch (status) {
            case "pending_payment":
                return "待支付";
            case "pending_accept":
                return "待取餐";
            case "delivering":
                return "配送中";
            case "completed":
                return "已完成";
            case "cancelled":
                return "已取消";
            case "pending_use":
                return "待使用";
            default:
                return status;
        }
    }
}
