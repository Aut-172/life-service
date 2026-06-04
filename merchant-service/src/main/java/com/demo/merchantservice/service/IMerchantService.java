package com.demo.merchantservice.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.demo.common.entity.Merchant;

public interface IMerchantService extends IService<Merchant> {
    Merchant findByUsername(String username);
    boolean updateStatus(Long merchantId, Integer status);
}