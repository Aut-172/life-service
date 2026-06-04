package com.demo.orderservice.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.demo.common.entity.GroupCoupon;
import com.demo.orderservice.mapper.GroupCouponMapper;
import org.springframework.stereotype.Service;
import java.util.Date;

@Service
public class GroupCouponServiceImpl extends ServiceImpl<GroupCouponMapper, GroupCoupon> implements IGroupCouponService {
    @Override
    public boolean verifyCoupon(String redeemCode) {
        GroupCoupon coupon = this.getOne(new LambdaQueryWrapper<GroupCoupon>()
                .eq(GroupCoupon::getRedeemCode, redeemCode)
                .eq(GroupCoupon::getCouponStatus, 0)
                .gt(GroupCoupon::getExpireTime, new Date()));
        return coupon != null;
    }

    @Override
    public boolean useCoupon(Long couponId) {
        GroupCoupon coupon = this.getById(couponId);
        if (coupon != null && coupon.getCouponStatus() == 0) {
            coupon.setCouponStatus(1);
            return this.updateById(coupon);
        }
        return false;
    }
}