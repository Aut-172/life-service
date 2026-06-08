package com.example.demo.payment.controller;

import com.example.demo.common.Result;
import com.example.demo.payment.dto.PayRequest;
import com.example.demo.payment.dto.PaymentVO;
import com.example.demo.payment.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 支付控制器
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    private Long getUserId(HttpServletRequest request) {
        return (Long) request.getAttribute("userId");
    }

    /**
     * 支付订单
     * POST /api/orders/{id}/pay
     */
    @PostMapping("/orders/{id}/pay")
    public Result<PaymentVO> payOrder(HttpServletRequest request,
                                       @PathVariable Long id,
                                       @RequestBody(required = false) PayRequest body) {
        String payMethod = (body != null) ? body.getPayMethod() : "ALIPAY";
        return Result.success(paymentService.pay(getUserId(request), id, payMethod));
    }

    /**
     * 查询订单支付记录
     * GET /api/orders/{id}/payments
     */
    @GetMapping("/orders/{id}/payments")
    public Result<List<PaymentVO>> getOrderPayments(@PathVariable Long id) {
        return Result.success(paymentService.getPaymentsByOrderId(id));
    }

    /**
     * 查询单条支付记录
     * GET /api/payments/{id}
     */
    @GetMapping("/payments/{id}")
    public Result<PaymentVO> getPayment(@PathVariable Long id) {
        return Result.success(paymentService.getPaymentById(id));
    }
}
