package com.demo.common.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 订单表（order）
 */
@Data
@TableName("`order`")
public class Order {
    @TableId(type = IdType.AUTO)
    private Long orderId;           // 订单ID
    private Long userId;            // 用户ID
    private Long merchantId;        // 商家ID
    private Long riderId;           // 骑手ID
    private Integer orderType;      // 订单类型：0外卖/1团购
    private BigDecimal totalAmount; // 总金额
    private BigDecimal paidAmount;  // 实际支付金额
    private Integer orderStatus;    // 订单状态
    private Long addressId;         // 收货地址ID
    private String addressDetail;   // 收货地址详情
    private String buyerRemark;     // 买家备注
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date createTime;        // 创建时间
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date payTime;           // 支付时间
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date completeTime;      // 完成时间
}