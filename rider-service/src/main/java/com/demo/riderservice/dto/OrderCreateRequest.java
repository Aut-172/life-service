package com.demo.orderservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 入场请求参数
 */
@Data
public class OrderCreateRequest {
//    @NotNull(message = "用户ID不能为空")
//    private Long userId;

    @NotNull(message = "停车场ID不能为空")
    private Long lotId;

    @NotBlank(message = "车牌号不能为空")
    private String plateNumber;
}