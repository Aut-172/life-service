package com.demo.orderservice.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.demo.common.entity.Order;
import java.math.BigDecimal;

public interface IOrderService extends IService<Order> {
    Long createOrder(Order order);
    boolean updateOrderStatus(Long orderId, Integer status);
    boolean assignRider(Long orderId, Long riderId);
    boolean processPayment(Long orderId, BigDecimal paidAmount);
}