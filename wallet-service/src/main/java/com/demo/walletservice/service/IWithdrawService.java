package com.demo.walletservice.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.demo.common.entity.Withdraw;

public interface IWithdrawService extends IService<Withdraw> {
    boolean applyWithdraw(Withdraw withdraw);
    boolean processWithdraw(Long withdrawId, Integer status);
}