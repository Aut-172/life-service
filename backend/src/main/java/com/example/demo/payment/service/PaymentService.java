package com.example.demo.payment.service;

import cn.hutool.core.lang.Snowflake;
import cn.hutool.core.util.IdUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.common.BusinessException;
import com.example.demo.order.entity.Orders;
import com.example.demo.order.mapper.OrdersMapper;
import com.example.demo.payment.dto.PaymentVO;
import com.example.demo.payment.entity.Payment;
import com.example.demo.payment.mapper.PaymentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 支付服务
 * 模拟支付宝/微信支付流程
 */
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentMapper paymentMapper;
    private final OrdersMapper ordersMapper;

    private final Snowflake snowflake = IdUtil.getSnowflake(1, 2);

    /**
     * 模拟支付
     *
     * @param userId    用户ID
     * @param orderId   订单ID
     * @param payMethod 支付方式 (ALIPAY/WECHAT)
     * @return 支付记录
     */
    @Transactional
    public PaymentVO pay(Long userId, Long orderId, String payMethod) {
        // 校验订单
        Orders order = ordersMapper.selectOne(
                new LambdaQueryWrapper<Orders>()
                        .eq(Orders::getId, orderId)
                        .eq(Orders::getUserId, userId)
        );
        if (order == null) {
            throw BusinessException.notFound("订单不存在");
        }
        if (!"pending_payment".equals(order.getStatus())) {
            throw BusinessException.badRequest("当前订单状态不允许支付");
        }

        // 生成支付流水号
        String transactionId = "TXN" + snowflake.nextId();

        // 创建支付记录
        Payment payment = new Payment();
        payment.setOrderId(orderId);
        payment.setAmount(order.getActualAmount());
        payment.setPayMethod(payMethod != null ? payMethod : "ALIPAY");
        payment.setTransactionId(transactionId);
        payment.setStatus("SUCCESS"); // 模拟支付成功
        payment.setPayTime(LocalDateTime.now());
        paymentMapper.insert(payment);

        // 更新订单状态
        order.setStatus("pending_accept");
        order.setPaidAt(LocalDateTime.now());
        ordersMapper.updateById(order);

        return toPaymentVO(payment);
    }

    /**
     * 查询订单的支付记录
     */
    public List<PaymentVO> getPaymentsByOrderId(Long orderId) {
        List<Payment> payments = paymentMapper.selectList(
                new LambdaQueryWrapper<Payment>()
                        .eq(Payment::getOrderId, orderId)
                        .orderByDesc(Payment::getCreateTime)
        );
        return payments.stream().map(this::toPaymentVO).collect(Collectors.toList());
    }

    /**
     * 查询单条支付记录
     */
    public PaymentVO getPaymentById(Long paymentId) {
        Payment payment = paymentMapper.selectById(paymentId);
        if (payment == null) {
            throw BusinessException.notFound("支付记录不存在");
        }
        return toPaymentVO(payment);
    }

    private PaymentVO toPaymentVO(Payment payment) {
        return PaymentVO.builder()
                .id(payment.getId())
                .orderId(payment.getOrderId())
                .amount(payment.getAmount())
                .payMethod(payment.getPayMethod())
                .transactionId(payment.getTransactionId())
                .status(payment.getStatus())
                .payTime(payment.getPayTime())
                .build();
    }
}
