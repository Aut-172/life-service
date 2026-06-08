package com.example.demo.delivery.controller;

import com.example.demo.common.Result;
import com.example.demo.delivery.dto.DeliveryVO;
import com.example.demo.delivery.service.DeliveryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.*;

/**
 * 配送追踪控制器
 */
@Tag(name = "配送追踪")
@RestController
@RequestMapping("/api")
public class DeliveryController {

    private final DeliveryService deliveryService;

    public DeliveryController(DeliveryService deliveryService) {
        this.deliveryService = deliveryService;
    }

    @Operation(summary = "获取配送追踪信息")
    @GetMapping("/delivery/{id}")
    public Result<DeliveryVO> getDeliveryInfo(@PathVariable Long id) {
        DeliveryVO delivery = deliveryService.getDeliveryInfo(id);
        if (delivery == null) {
            return Result.notFound("订单不存在");
        }
        return Result.success(delivery);
    }
}
