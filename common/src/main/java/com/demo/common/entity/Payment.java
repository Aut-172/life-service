package com.demo.common.entity;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 支付记录表（payment）
 */
@Data
@TableName("payment")
public class Payment {
    @TableId(type = IdType.AUTO)
    private Long paymentId;         // 支付ID
    private Long orderId;           // 订单ID
    private BigDecimal amount;      // 金额
    private Integer paymentMethod;  // 支付方式
    private String transactionNo;   // 流水号
    private Integer paymentStatus;  // 支付状态
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date payTime;           // 支付时间
}