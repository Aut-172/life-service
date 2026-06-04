package com.demo.merchantservice.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.demo.common.entity.Merchant;
import com.demo.merchantservice.mapper.MerchantMapper;
import org.springframework.stereotype.Service;

@Service
public class MerchantServiceImpl extends ServiceImpl<MerchantMapper, Merchant> implements IMerchantService {
    @Override
    public Merchant findByUsername(String username) {
        return this.getOne(new LambdaQueryWrapper<Merchant>().eq(Merchant::getUsername, username));
    }

    @Override
    public boolean updateStatus(Long merchantId, Integer status) {
        Merchant merchant = this.getById(merchantId);
        if (merchant != null) {
            merchant.setMerchantStatus(status);
            return this.updateById(merchant);
        }
        return false;
    }
}