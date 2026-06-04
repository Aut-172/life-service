package com.demo.orderservice.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.demo.common.entity.OrderItem;
import com.demo.orderservice.mapper.OrderItemMapper;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class OrderItemServiceImpl extends ServiceImpl<OrderItemMapper, OrderItem> implements IOrderItemService {
    @Override
    public List<OrderItem> getItemsByOrderId(Long orderId) {
        return this.list(new LambdaQueryWrapper<OrderItem>().eq(OrderItem::getOrderId, orderId));
    }
}