package com.demo.common.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;

import java.util.Date;

import static com.baomidou.mybatisplus.annotation.IdType.*;

/**
 * 骑手表（rider）
 */
@Data
@TableName("rider")
public class Rider {
    @TableId(type = AUTO)
    private Long riderId;           // 骑手ID
    private String name;            // 姓名
    private String password;        // 密码（密文）
    private String phone;           // 手机号
    private String idCard;          // 身份证号
    private Integer riderStatus;    // 骑手状态：0待审核/1已通过/2已冻结
    private String auditRemark;     // 审核意见
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss", timezone = "GMT+8")
    private Date registerTime;      // 注册时间
}