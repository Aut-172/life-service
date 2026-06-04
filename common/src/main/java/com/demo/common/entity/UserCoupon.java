package com.demo.common.entity;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 用户优惠券表（user_coupon）
 */
@Data
@TableName("user_coupon")
public class UserCoupon {
    @TableId(type = IdType.AUTO)
    private Long recordId;          // 记录ID
    private Long userId;            // 用户ID
    private Long couponId;          // 优惠券ID
    private Integer couponStatus;   // 优惠券状态：0未使用/1已锁定/2已使用/3已过期
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date receiveTime;       // 领取时间
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date useTime;           // 使用时间
}