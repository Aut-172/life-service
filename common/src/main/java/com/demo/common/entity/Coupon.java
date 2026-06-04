package com.demo.common.entity;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 优惠券表（coupon）
 */
@Data
@TableName("coupon")
public class Coupon {
    @TableId(type = IdType.AUTO)
    private Long couponId;          // 优惠券ID
    private String couponName;      // 优惠券名称
    private BigDecimal denomination;// 面值
    private BigDecimal condition;   // 使用条件（满减门槛）
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date startTime;         // 有效开始时间
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date endTime;           // 有效结束时间
    private Integer totalQuantity;  // 发行总量
    private Integer receivedCount;  // 已领取数量
    private Integer limitPerUser;   // 每人限领数量
    private Integer couponStatus;   // 优惠券状态：0未发布/1发行中/2已结束
}