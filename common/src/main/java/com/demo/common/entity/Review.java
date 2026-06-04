package com.demo.common.entity;
import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 评价表（review）
 */
@Data
@TableName("review")
public class Review {
    @TableId(type = IdType.AUTO)
    private Long reviewId;          // 评价ID
    private Long orderId;           // 订单ID
    private Long userId;            // 用户ID
    private Long merchantId;        // 商家ID
    private Long productId;         // 商品ID
    private Integer score;          // 评分（1-5）
    private String content;         // 评价内容
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date createTime;        // 创建时间
}