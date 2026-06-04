package com.demo.common.entity;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 团购券表（group_coupon）
 */
@Data
@TableName("group_coupon")
public class GroupCoupon {
    @TableId(type = IdType.AUTO)
    private Long couponId;          // 团购券ID
    private Long orderItemId;       // 订单明细ID
    private String redeemCode;      // 核销码
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date expireTime;        // 有效期
    private Integer usedCount;      // 已核销数量
    private Integer couponStatus;   // 团购券状态：0待使用/1已使用/2已过期
}