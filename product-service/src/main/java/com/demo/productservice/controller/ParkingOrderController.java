package com.demo.orderservice.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.demo.common.dto.Response;
import com.demo.common.exception.BusinessException;
import com.demo.orderservice.dto.OrderCreateRequest;
import com.demo.orderservice.dto.OrderUpdateRequest;
import com.demo.common.entity.ParkingOrder;
import com.demo.orderservice.service.IParkingOrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/parking-orders")
public class ParkingOrderController {
    @Autowired
    private IParkingOrderService parkingOrderService;

    /**
     * 入场：创建订单
     */
    @PostMapping
    public Response<Long> createParkingOrder(@Valid @RequestBody OrderCreateRequest request) {
        // 从 SecurityContext 获取当前登录用户 ID
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Long userId)) {
            throw new BusinessException(401, "用户未登录或登录已过期");
        }

        try {
            Long orderId = parkingOrderService.createOrder(userId, request);
            return Response.success(orderId);
        } catch (RuntimeException e) {
            throw new BusinessException(500,e.getMessage());
        }
    }

    /**
     * 离场：完成订单
     */
    @PutMapping
    public Response<ParkingOrder> updateParkingOrder(@Valid @RequestBody OrderUpdateRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Long userId)) {
            return Response.error(401, "用户未登录或登录已过期");
        }
        try {
            ParkingOrder order = parkingOrderService.completeOrder(userId,request);
            return Response.success(order);
        } catch (RuntimeException e) {
            return Response.error(e.getMessage());
        }
    }

    @GetMapping
    public Response<IPage<ParkingOrder>> personalParkingOrders(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Long userId)) {
            return Response.error(401, "用户未登录或登录已过期");
        }
        IPage<ParkingOrder> page = parkingOrderService.getParkingOrdersByUserId(userId,pageNum, pageSize);
        return Response.success(page);
    }
}
