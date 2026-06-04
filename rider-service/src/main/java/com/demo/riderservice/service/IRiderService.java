package com.demo.riderservice.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.demo.common.entity.Rider;

public interface IRiderService extends IService<Rider> {
    Rider findByPhone(String phone);
    boolean updateStatus(Long riderId, Integer status, String remark);
}