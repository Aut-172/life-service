package com.example.demo.coupon.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.example.demo.common.BusinessException;
import com.example.demo.coupon.dto.CouponVO;
import com.example.demo.coupon.entity.Coupon;
import com.example.demo.coupon.entity.UserCoupon;
import com.example.demo.coupon.mapper.CouponMapper;
import com.example.demo.coupon.mapper.UserCouponMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 优惠券服务
 */
@Service
@RequiredArgsConstructor
public class CouponService {

    private final CouponMapper couponMapper;
    private final UserCouponMapper userCouponMapper;

    /**
     * 获取用户可用优惠券列表
     */
    public List<CouponVO> getUserCoupons(Long userId) {
        // 查询用户已领取的优惠券
        List<UserCoupon> userCoupons = userCouponMapper.selectList(
                new LambdaQueryWrapper<UserCoupon>()
                        .eq(UserCoupon::getUserId, userId)
                        .orderByDesc(UserCoupon::getCreateTime)
        );

        return userCoupons.stream()
                .map(uc -> {
                    Coupon coupon = couponMapper.selectById(uc.getCouponId());
                    if (coupon == null) return null;
                    return CouponVO.builder()
                            .id(uc.getId())
                            .title(coupon.getName())
                            .description("满" + coupon.getThreshold().stripTrailingZeros().toPlainString()
                                    + "减" + coupon.getDiscount().stripTrailingZeros().toPlainString())
                            .threshold(coupon.getThreshold())
                            .discount(coupon.getDiscount())
                            .expireAt(coupon.getEndTime())
                            .status(uc.getStatus())
                            .build();
                })
                .filter(vo -> vo != null)
                .collect(Collectors.toList());
    }

    /**
     * 获取所有可领取的优惠券（已发布且在有效期内）
     */
    public List<CouponVO> getAvailableCoupons() {
        LocalDateTime now = LocalDateTime.now();
        List<Coupon> coupons = couponMapper.selectList(
                new LambdaQueryWrapper<Coupon>()
                        .eq(Coupon::getStatus, "released")
                        .le(Coupon::getStartTime, now)
                        .ge(Coupon::getEndTime, now)
        );
        return coupons.stream().map(c -> CouponVO.builder()
                .id(c.getId())
                .title(c.getName())
                .description("满" + c.getThreshold().stripTrailingZeros().toPlainString()
                        + "减" + c.getDiscount().stripTrailingZeros().toPlainString())
                .threshold(c.getThreshold())
                .discount(c.getDiscount())
                .expireAt(c.getEndTime())
                .build()
        ).collect(Collectors.toList());
    }

    /**
     * 用户领取优惠券
     */
    @Transactional
    public CouponVO claimCoupon(Long userId, Long couponId) {
        Coupon coupon = couponMapper.selectById(couponId);
        if (coupon == null) {
            throw BusinessException.notFound("优惠券不存在");
        }

        // 校验优惠券状态
        LocalDateTime now = LocalDateTime.now();
        if (!"released".equals(coupon.getStatus())) {
            throw BusinessException.badRequest("该优惠券未发布");
        }
        if (now.isBefore(coupon.getStartTime()) || now.isAfter(coupon.getEndTime())) {
            throw BusinessException.badRequest("该优惠券不在有效期内");
        }

        // 校验库存
        if (coupon.getClaimedCount() >= coupon.getTotalCount()) {
            throw BusinessException.badRequest("该优惠券已被领完");
        }

        // 校验每人限领
        Long userClaimed = userCouponMapper.selectCount(
                new LambdaQueryWrapper<UserCoupon>()
                        .eq(UserCoupon::getUserId, userId)
                        .eq(UserCoupon::getCouponId, couponId)
        );
        if (userClaimed >= coupon.getLimitPerUser()) {
            throw BusinessException.badRequest("已达到领取上限");
        }

        // 创建用户优惠券记录
        UserCoupon userCoupon = new UserCoupon();
        userCoupon.setUserId(userId);
        userCoupon.setCouponId(couponId);
        userCoupon.setStatus("unused");
        userCoupon.setClaimedAt(now);
        userCouponMapper.insert(userCoupon);

        // 更新已领取数量
        coupon.setClaimedCount(coupon.getClaimedCount() + 1);
        couponMapper.updateById(coupon);

        return CouponVO.builder()
                .id(userCoupon.getId())
                .title(coupon.getName())
                .description("满" + coupon.getThreshold().stripTrailingZeros().toPlainString()
                        + "减" + coupon.getDiscount().stripTrailingZeros().toPlainString())
                .threshold(coupon.getThreshold())
                .discount(coupon.getDiscount())
                .expireAt(coupon.getEndTime())
                .status("unused")
                .build();
    }

    /**
     * 使用优惠券（锁定）
     */
    @Transactional
    public void useCoupon(Long userCouponId, Long orderId) {
        UserCoupon userCoupon = userCouponMapper.selectById(userCouponId);
        if (userCoupon == null) {
            throw BusinessException.notFound("优惠券不存在");
        }
        if (!"unused".equals(userCoupon.getStatus())) {
            throw BusinessException.badRequest("该优惠券已使用或已过期");
        }
        userCoupon.setStatus("locked");
        userCoupon.setOrderId(orderId);
        userCouponMapper.updateById(userCoupon);
    }

    /**
     * 确认使用优惠券（订单完成后）
     */
    @Transactional
    public void confirmUseCoupon(Long orderId) {
        UserCoupon userCoupon = userCouponMapper.selectOne(
                new LambdaQueryWrapper<UserCoupon>()
                        .eq(UserCoupon::getOrderId, orderId)
        );
        if (userCoupon != null && "locked".equals(userCoupon.getStatus())) {
            userCoupon.setStatus("used");
            userCoupon.setUsedAt(LocalDateTime.now());
            userCouponMapper.updateById(userCoupon);
        }
    }

    /**
     * 释放优惠券（订单取消时）
     */
    @Transactional
    public void releaseCoupon(Long orderId) {
        UserCoupon userCoupon = userCouponMapper.selectOne(
                new LambdaQueryWrapper<UserCoupon>()
                        .eq(UserCoupon::getOrderId, orderId)
        );
        if (userCoupon != null && "locked".equals(userCoupon.getStatus())) {
            userCoupon.setStatus("unused");
            userCoupon.setOrderId(null);
            userCouponMapper.updateById(userCoupon);
        }
    }
}
