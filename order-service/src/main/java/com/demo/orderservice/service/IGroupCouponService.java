package com.demo.orderservice.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.demo.common.entity.GroupCoupon;

public interface IGroupCouponService extends IService<GroupCoupon> {
    boolean verifyCoupon(String redeemCode);
    boolean useCoupon(Long couponId);
}