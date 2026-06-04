package com.demo.common.entity;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 消息表（message）
 */
@Data
@TableName("message")
public class Message {
    @TableId(type = IdType.AUTO)
    private Long messageId;         // 消息ID
    private Long senderId;          // 发送方ID
    private Integer senderType;     // 发送方类型：0用户/1商家/2骑手
    private Long receiverId;        // 接收方ID
    private Integer receiverType;   // 接收方类型
    private Long orderId;           // 订单ID
    private String content;         // 消息内容
    private Boolean isRead;         // 是否已读
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date sendTime;          // 发送时间
}