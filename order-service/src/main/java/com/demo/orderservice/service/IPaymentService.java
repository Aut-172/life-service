package com.demo.orderservice.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.demo.common.entity.Payment;

public interface IPaymentService extends IService<Payment> {
    Payment getByOrderId(Long orderId);
}