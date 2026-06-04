package com.demo.orderservice.controller;

import com.demo.common.dto.Response;
import com.demo.common.entity.Order;
import com.demo.common.entity.OrderItem;
import com.demo.orderservice.service.IOrderItemService;
import com.demo.orderservice.service.IOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/order")
public class OrderController {

    @Autowired
    private IOrderService orderService;
    @Autowired
    private IOrderItemService orderItemService;

    // ---------- 用户下单 ----------
    @PostMapping("/create")
    public Response<Long> createOrder(@RequestBody Order order) {
        Long userId = getCurrentUserId();
        order.setUserId(userId);
        return Response.success(orderService.createOrder(order));
    }

    // 用户查看自己的订单
    @GetMapping("/user/orders")
    public Response<List<Order>> getUserOrders() {
        Long userId = getCurrentUserId();
        List<Order> orders = orderService.list(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Order>()
                .eq(Order::getUserId, userId));
        return Response.success(orders);
    }

    // 订单详情（含明细）
    @GetMapping("/{orderId}")
    public Response<Order> getOrderDetail(@PathVariable Long orderId) {
        Order order = orderService.getById(orderId);
        List<OrderItem> items = orderItemService.getItemsByOrderId(orderId);
        order.setItems(items); // 需在Order实体中添加items字段（略）
        return Response.success(order);
    }

    // ---------- 商家订单处理 ----------
    @GetMapping("/merchant/orders")
    public Response<List<Order>> getMerchantOrders() {
        Long merchantId = getCurrentMerchantId();
        List<Order> orders = orderService.list(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Order>()
                .eq(Order::getMerchantId, merchantId));
        return Response.success(orders);
    }

    @PutMapping("/merchant/order/{orderId}/accept")
    public Response<Boolean> acceptOrder(@PathVariable Long orderId) {
        return Response.success(orderService.updateOrderStatus(orderId, 2)); // 假设2=待配送
    }

    @PutMapping("/merchant/order/{orderId}/reject")
    public Response<Boolean> rejectOrder(@PathVariable Long orderId) {
        return Response.success(orderService.updateOrderStatus(orderId, 5)); // 5=已取消
    }

    @PutMapping("/merchant/order/{orderId}/complete")
    public Response<Boolean> completeOrder(@PathVariable Long orderId) {
        return Response.success(orderService.updateOrderStatus(orderId, 4)); // 4=已完成
    }

    // ---------- 骑手接单 ----------
    @GetMapping("/rider/available-orders")
    public Response<List<Order>> getAvailableOrders() {
        // 查询待配送的订单
        List<Order> orders = orderService.list(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Order>()
                .eq(Order::getOrderStatus, 2));
        return Response.success(orders);
    }

    @PutMapping("/rider/order/{orderId}/accept")
    public Response<Boolean> acceptRiderOrder(@PathVariable Long orderId) {
        Long riderId = getCurrentRiderId();
        return Response.success(orderService.assignRider(orderId, riderId));
    }

    // 骑手查看配送中的订单
    @GetMapping("/rider/orders")
    public Response<List<Order>> getRiderOrders() {
        Long riderId = getCurrentRiderId();
        List<Order> orders = orderService.list(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Order>()
                .eq(Order::getRiderId, riderId));
        return Response.success(orders);
    }

    // 更新配送状态（调用订单状态变更）
    @PutMapping("/rider/order/{orderId}/deliver")
    public Response<Boolean> deliverOrder(@PathVariable Long orderId) {
        return Response.success(orderService.updateOrderStatus(orderId, 3)); // 假设3=配送中
    }

    // 显示配送情况（简单返回订单状态）
    @GetMapping("/track/{orderId}")
    public Response<Integer> getDeliveryStatus(@PathVariable Long orderId) {
        Order order = orderService.getById(orderId);
        return Response.success(order.getOrderStatus());
    }

    private Long getCurrentUserId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
    private Long getCurrentMerchantId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
    private Long getCurrentRiderId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}