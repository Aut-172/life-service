package com.demo.walletservice.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.demo.common.entity.WalletRecord;
import java.math.BigDecimal;
import java.util.List;

public interface IWalletRecordService extends IService<WalletRecord> {
    void addRecord(Integer userType, Long userId, BigDecimal amount, Integer bizType, Long orderId);
    BigDecimal getBalance(Integer userType, Long userId);
}