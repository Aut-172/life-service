package com.demo.walletservice.service;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.demo.common.entity.Withdraw;
import com.demo.walletservice.mapper.WithdrawMapper;
import org.springframework.stereotype.Service;
import java.util.Date;

@Service
public class WithdrawServiceImpl extends ServiceImpl<WithdrawMapper, Withdraw> implements IWithdrawService {
    @Override
    public boolean applyWithdraw(Withdraw withdraw) {
        withdraw.setApplyTime(new Date());
        withdraw.setWithdrawStatus(0); // 处理中
        return this.save(withdraw);
    }

    @Override
    public boolean processWithdraw(Long withdrawId, Integer status) {
        Withdraw withdraw = this.getById(withdrawId);
        if (withdraw != null && withdraw.getWithdrawStatus() == 0) {
            withdraw.setWithdrawStatus(status);
            return this.updateById(withdraw);
        }
        return false;
    }
}