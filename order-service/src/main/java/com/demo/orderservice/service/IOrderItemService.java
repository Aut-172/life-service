package com.demo.orderservice.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.demo.common.entity.OrderItem;
import java.util.List;

public interface IOrderItemService extends IService<OrderItem> {
    List<OrderItem> getItemsByOrderId(Long orderId);
}