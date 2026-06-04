package com.demo.walletservice.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.demo.common.entity.WalletRecord;
import com.demo.walletservice.mapper.WalletRecordMapper;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.util.Date;
import java.util.List;

@Service
public class WalletRecordServiceImpl extends ServiceImpl<WalletRecordMapper, WalletRecord> implements IWalletRecordService {
    @Override
    public void addRecord(Integer userType, Long userId, BigDecimal amount, Integer bizType, Long orderId) {
        WalletRecord record = new WalletRecord();
        record.setUserType(userType);
        record.setUserId(userId);
        record.setAmount(amount);
        record.setBizType(bizType);
        record.setOrderId(orderId);
        record.setCreateTime(new Date());
        this.save(record);
    }

    @Override
    public BigDecimal getBalance(Integer userType, Long userId) {
        List<WalletRecord> records = this.list(new LambdaQueryWrapper<WalletRecord>()
                .eq(WalletRecord::getUserType, userType)
                .eq(WalletRecord::getUserId, userId));
        return records.stream()
                .map(WalletRecord::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}