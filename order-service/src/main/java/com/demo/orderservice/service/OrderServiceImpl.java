package com.demo.orderservice.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.demo.common.entity.Order;
import com.demo.orderservice.mapper.OrderMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Date;

@Service
public class OrderServiceImpl extends ServiceImpl<OrderMapper, Order> implements IOrderService {
    @Override
    @Transactional
    public Long createOrder(Order order) {
        order.setCreateTime(new Date());
        this.save(order);
        return order.getOrderId();
    }

    @Override
    public boolean updateOrderStatus(Long orderId, Integer status) {
        Order order = this.getById(orderId);
        if (order != null) {
            order.setOrderStatus(status);
            if (status == 2) { // 假设2表示已完成
                order.setCompleteTime(new Date());
            }
            return this.updateById(order);
        }
        return false;
    }

    @Override
    public boolean assignRider(Long orderId, Long riderId) {
        Order order = this.getById(orderId);
        if (order != null && order.getRiderId() == null) {
            order.setRiderId(riderId);
            return this.updateById(order);
        }
        return false;
    }

    @Override
    public boolean processPayment(Long orderId, BigDecimal paidAmount) {
        Order order = this.getById(orderId);
        if (order != null && order.getPaidAmount() == null) {
            order.setPaidAmount(paidAmount);
            order.setPayTime(new Date());
            order.setOrderStatus(1); // 假设1表示已支付
            return this.updateById(order);
        }
        return false;
    }
}