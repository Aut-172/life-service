package com.demo.common.entity;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 钱包记录表（wallet_record）
 */
@Data
@TableName("wallet_record")
public class WalletRecord {
    @TableId(type = IdType.AUTO)
    private Long recordId;          // 记录ID
    private Integer userType;       // 用户类型：0商家/1骑手
    private Long userId;            // 用户ID
    private BigDecimal amount;      // 金额
    private Integer bizType;        // 业务类型：0订单收入/1提现支出
    private Long orderId;           // 关联订单ID
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date createTime;        // 创建时间
}