package com.demo.walletservice.controller;

import com.demo.common.dto.Response;
import com.demo.common.entity.WalletRecord;
import com.demo.common.entity.Withdraw;
import com.demo.walletservice.service.IWalletRecordService;
import com.demo.walletservice.service.IWithdrawService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/wallet")
public class WalletController {

    @Autowired
    private IWalletRecordService walletRecordService;
    @Autowired
    private IWithdrawService withdrawService;

    // 获取余额（根据当前登录用户类型动态判断）
    @GetMapping("/balance")
    public Response<BigDecimal> getBalance() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof Long userId) {
            // 此处需知道是商家还是骑手，简化：从请求头获取用户类型
            String userType = getCurrentUserType(); // 模拟，实际应从token中获取
            return Response.success(walletRecordService.getBalance("merchant".equals(userType) ? 0 : 1, userId));
        }
        return Response.error("未登录");
    }

    // 交易记录
    @GetMapping("/records")
    public Response<List<WalletRecord>> getRecords() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userType = getCurrentUserType();
        Long userId = (Long) principal;
        List<WalletRecord> records = walletRecordService.list(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<WalletRecord>()
                .eq(WalletRecord::getUserType, "merchant".equals(userType) ? 0 : 1)
                .eq(WalletRecord::getUserId, userId));
        return Response.success(records);
    }

    // 申请提现
    @PostMapping("/withdraw")
    public Response<Boolean> applyWithdraw(@RequestParam BigDecimal amount, @RequestParam String receiveMethod) {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userType = getCurrentUserType();
        Withdraw withdraw = new Withdraw();
        withdraw.setUserType("merchant".equals(userType) ? 0 : 1);
        withdraw.setUserId((Long) principal);
        withdraw.setAmount(amount);
        withdraw.setReceiveMethod(receiveMethod);
        return Response.success(withdrawService.applyWithdraw(withdraw));
    }

    // 提现记录
    @GetMapping("/withdraws")
    public Response<List<Withdraw>> getWithdraws() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String userType = getCurrentUserType();
        Long userId = (Long) principal;
        List<Withdraw> withdraws = withdrawService.list(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Withdraw>()
                .eq(Withdraw::getUserType, "merchant".equals(userType) ? 0 : 1)
                .eq(Withdraw::getUserId, userId));
        return Response.success(withdraws);
    }

    private String getCurrentUserType() {
        // 实际应从SecurityContext中的Authentication的authorities或details获取
        // 此处模拟返回"merchant"或"rider"
        return "merchant";
    }
}