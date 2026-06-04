package com.demo.orderservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 离场请求参数
 */
@Data
public class OrderUpdateRequest {
    @NotNull(message = "订单ID不能为空")
    private Long orderId;
}