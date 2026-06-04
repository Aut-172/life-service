package com.demo.common.entity;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 提现记录表（withdraw）
 */
@Data
@TableName("withdraw")
public class Withdraw {
    @TableId(type = IdType.AUTO)
    private Long withdrawId;        // 提现ID
    private Integer userType;       // 用户类型：0商家/1骑手
    private Long userId;            // 用户ID
    private BigDecimal amount;      // 提现金额
    private String receiveMethod;   // 收款方式
    private Integer withdrawStatus; // 提现状态：0处理中/1已打款/2已拒绝
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date applyTime;         // 申请时间
}
