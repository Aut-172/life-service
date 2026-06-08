package com.example.demo.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 订单视图对象
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderVO {

    private Long id;
    private String orderNo;
    private Long merchantId;
    private String merchant;
    private String merchantAvatar;
    private String status;
    private BigDecimal total;
    private BigDecimal deliveryFee;
    private BigDecimal discount;
    private String eta;
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;
    private Long riderId;
    private String riderName;
    private String riderPhone;
    private String address;
    private List<OrderItemVO> items;
    private List<String> reviewedProductIds;
    private List<TimelineItem> timeline;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemVO {
        private Long productId;
        private String name;
        private BigDecimal price;
        private Integer quantity;
        private String image;
        private String specLabel;
        private Boolean reviewed;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimelineItem {
        private String label;
        private String time;
    }
}
