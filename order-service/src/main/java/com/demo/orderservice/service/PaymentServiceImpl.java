package com.demo.orderservice.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.demo.common.entity.Payment;
import com.demo.orderservice.mapper.PaymentMapper;
import org.springframework.stereotype.Service;

@Service
public class PaymentServiceImpl extends ServiceImpl<PaymentMapper, Payment> implements IPaymentService {
    @Override
    public Payment getByOrderId(Long orderId) {
        return this.getOne(new LambdaQueryWrapper<Payment>().eq(Payment::getOrderId, orderId));
    }
}