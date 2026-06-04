package com.demo.riderservice.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.demo.common.entity.Rider;
import com.demo.riderservice.mapper.RiderMapper;
import org.springframework.stereotype.Service;

@Service
public class RiderServiceImpl extends ServiceImpl<RiderMapper, Rider> implements IRiderService {
    @Override
    public Rider findByPhone(String phone) {
        return this.getOne(new LambdaQueryWrapper<Rider>().eq(Rider::getPhone, phone));
    }

    @Override
    public boolean updateStatus(Long riderId, Integer status, String remark) {
        Rider rider = this.getById(riderId);
        if (rider != null) {
            rider.setRiderStatus(status);
            rider.setAuditRemark(remark);
            return this.updateById(rider);
        }
        return false;
    }
}