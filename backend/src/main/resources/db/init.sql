-- ============================================
-- 生活助手平台 - 数据库初始化脚本
-- 数据库: life_assistant
-- ============================================

CREATE DATABASE IF NOT EXISTS `life_assistant` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `life_assistant`;

-- ============================================
-- 1. 用户表 (user)
-- ============================================
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
    `id`            BIGINT       NOT NULL COMMENT '用户ID',
    `username`      VARCHAR(50)  NOT NULL COMMENT '用户名',
    `password`      VARCHAR(255) NOT NULL COMMENT '密码(BCrypt加密)',
    `phone`         VARCHAR(20)  DEFAULT NULL COMMENT '手机号',
    `nickname`      VARCHAR(50)  DEFAULT NULL COMMENT '昵称',
    `avatar`        VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
    `role`          VARCHAR(20)  NOT NULL DEFAULT 'consumer' COMMENT '角色: consumer/merchant/rider/admin',
    `status`        VARCHAR(20)  NOT NULL DEFAULT 'active' COMMENT '状态: active/frozen',
    `create_time`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`),
    UNIQUE KEY `uk_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ============================================
-- 2. 商家表 (merchant)
-- ============================================
DROP TABLE IF EXISTS `merchant`;
CREATE TABLE `merchant` (
    `id`                BIGINT       NOT NULL COMMENT '商家ID',
    `username`          VARCHAR(50)  NOT NULL COMMENT '用户名',
    `password`          VARCHAR(255) NOT NULL COMMENT '密码(BCrypt加密)',
    `name`              VARCHAR(100) NOT NULL COMMENT '商家名称',
    `phone`             VARCHAR(20)  DEFAULT NULL COMMENT '联系电话',
    `address`           VARCHAR(255) DEFAULT NULL COMMENT '营业地址',
    `longitude`         DECIMAL(10,7) DEFAULT NULL COMMENT '经度',
    `latitude`          DECIMAL(10,7) DEFAULT NULL COMMENT '纬度',
    `business_hours`    VARCHAR(100) DEFAULT '09:00-22:00' COMMENT '营业时间',
    `category`          VARCHAR(50)  DEFAULT NULL COMMENT '商家类型: 餐饮/休闲娱乐/生活服务',
    `description`       VARCHAR(500) DEFAULT NULL COMMENT '店铺简介',
    `avatar`            VARCHAR(500) DEFAULT NULL COMMENT '商家头像URL',
    `tags`              VARCHAR(255) DEFAULT NULL COMMENT '标签(逗号分隔)',
    `status`            VARCHAR(20)  NOT NULL DEFAULT 'pending' COMMENT '状态: pending/active/rest/frozen',
    `rating`            DECIMAL(2,1) DEFAULT '0.0' COMMENT '综合评分',
    `monthly_sales`     INT          DEFAULT 0 COMMENT '月销量',
    `min_delivery_fee`  DECIMAL(10,2) DEFAULT 0.00 COMMENT '起送价',
    `delivery_fee`      DECIMAL(10,2) DEFAULT 5.00 COMMENT '配送费',
    `delivery_radius`   INT          DEFAULT 5 COMMENT '配送半径(公里)',
    `create_time`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`),
    KEY `idx_status` (`status`),
    KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商家表';

-- ============================================
-- 3. 骑手表 (rider)
-- ============================================
DROP TABLE IF EXISTS `rider`;
CREATE TABLE `rider` (
    `id`            BIGINT       NOT NULL COMMENT '骑手ID',
    `name`          VARCHAR(50)  NOT NULL COMMENT '姓名',
    `password`      VARCHAR(255) NOT NULL COMMENT '密码(BCrypt加密)',
    `phone`         VARCHAR(20)  NOT NULL COMMENT '手机号',
    `id_card`       VARCHAR(20)  DEFAULT NULL COMMENT '身份证号',
    `status`        VARCHAR(20)  NOT NULL DEFAULT 'pending' COMMENT '状态: pending/active/frozen',
    `audit_opinion` VARCHAR(255) DEFAULT NULL COMMENT '审核意见',
    `service_area`  VARCHAR(100) DEFAULT NULL COMMENT '服务区域',
    `create_time`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='骑手表';

-- ============================================
-- 4. 管理员表 (admin)
-- ============================================
DROP TABLE IF EXISTS `admin`;
CREATE TABLE `admin` (
    `id`          BIGINT       NOT NULL COMMENT '管理员ID',
    `username`    VARCHAR(50)  NOT NULL COMMENT '用户名',
    `password`    VARCHAR(255) NOT NULL COMMENT '密码(BCrypt加密)',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';

-- ============================================
-- 5. 分类表 (category)
-- ============================================
DROP TABLE IF EXISTS `category`;
CREATE TABLE `category` (
    `id`          BIGINT      NOT NULL COMMENT '分类ID',
    `name`        VARCHAR(50) NOT NULL COMMENT '分类名称',
    `parent_id`   BIGINT      DEFAULT NULL COMMENT '父分类ID',
    `sort_order`  INT         DEFAULT 0 COMMENT '排序',
    `create_time` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分类表';

-- ============================================
-- 6. 商品表 (product)
-- ============================================
DROP TABLE IF EXISTS `product`;
CREATE TABLE `product` (
    `id`            BIGINT       NOT NULL COMMENT '商品ID',
    `merchant_id`   BIGINT       NOT NULL COMMENT '商家ID',
    `category_id`   BIGINT       DEFAULT NULL COMMENT '分类ID',
    `name`          VARCHAR(100) NOT NULL COMMENT '商品名称',
    `description`   VARCHAR(500) DEFAULT NULL COMMENT '商品描述',
    `price`         DECIMAL(10,2) NOT NULL COMMENT '商品价格',
    `stock`         INT          NOT NULL DEFAULT 0 COMMENT '库存',
    `type`          VARCHAR(20)  NOT NULL DEFAULT 'delivery' COMMENT '商品类型: delivery(外卖)/group(团购)',
    `status`        VARCHAR(20)  NOT NULL DEFAULT 'active' COMMENT '状态: active/inactive/sold_out',
    `image`         VARCHAR(500) DEFAULT NULL COMMENT '主图URL',
    `gallery`       TEXT         DEFAULT NULL COMMENT '轮播图URL(JSON数组)',
    `monthly_sales` INT          DEFAULT 0 COMMENT '月销量',
    `create_time`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_merchant_id` (`merchant_id`),
    KEY `idx_category_id` (`category_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表';

-- ============================================
-- 7. 商品规格分组表 (spec_group)
-- ============================================
DROP TABLE IF EXISTS `spec_group`;
CREATE TABLE `spec_group` (
    `id`          BIGINT       NOT NULL COMMENT '规格分组ID',
    `product_id`  BIGINT       NOT NULL COMMENT '商品ID',
    `name`        VARCHAR(50)  NOT NULL COMMENT '规格分组名称(如: 规格)',
    `values`      TEXT         NOT NULL COMMENT '规格值(JSON数组, 如: ["大份","小份"])',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品规格分组表';

-- ============================================
-- 8. 商品规格变体表 (product_spec)
-- ============================================
DROP TABLE IF EXISTS `product_spec`;
CREATE TABLE `product_spec` (
    `id`          BIGINT       NOT NULL COMMENT '规格ID',
    `product_id`  BIGINT       NOT NULL COMMENT '商品ID',
    `label`       VARCHAR(50)  NOT NULL COMMENT '规格标签(如: 大份)',
    `price`       DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '加价金额',
    `stock`       INT          NOT NULL DEFAULT 0 COMMENT '规格库存',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品规格变体表';

-- ============================================
-- 9. 购物车表 (cart)
-- ============================================
DROP TABLE IF EXISTS `cart`;
CREATE TABLE `cart` (
    `id`          BIGINT       NOT NULL COMMENT '购物车项ID',
    `user_id`     BIGINT       NOT NULL COMMENT '用户ID',
    `merchant_id` BIGINT       NOT NULL COMMENT '商家ID',
    `product_id`  BIGINT       NOT NULL COMMENT '商品ID',
    `name`        VARCHAR(100) NOT NULL COMMENT '商品名称(快照)',
    `price`       DECIMAL(10,2) NOT NULL COMMENT '商品价格(快照)',
    `image`       VARCHAR(500) DEFAULT NULL COMMENT '商品图片',
    `quantity`    INT          NOT NULL DEFAULT 1 COMMENT '数量',
    `spec_label`  VARCHAR(50)  DEFAULT NULL COMMENT '规格标签',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '添加时间',
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_merchant_id` (`merchant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='购物车表';

-- ============================================
-- 10. 订单表 (order)
-- ============================================
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
    `id`                BIGINT       NOT NULL COMMENT '订单ID',
    `order_no`          VARCHAR(50)  NOT NULL COMMENT '订单编号',
    `user_id`           BIGINT       NOT NULL COMMENT '用户ID',
    `merchant_id`       BIGINT       NOT NULL COMMENT '商家ID',
    `rider_id`          BIGINT       DEFAULT NULL COMMENT '骑手ID',
    `type`              VARCHAR(20)  NOT NULL DEFAULT 'delivery' COMMENT '订单类型: delivery(外卖)/group(团购)',
    `total_amount`      DECIMAL(10,2) NOT NULL COMMENT '总金额',
    `actual_amount`     DECIMAL(10,2) NOT NULL COMMENT '实际支付金额',
    `delivery_fee`      DECIMAL(10,2) DEFAULT 0.00 COMMENT '配送费',
    `discount`          DECIMAL(10,2) DEFAULT 0.00 COMMENT '优惠金额',
    `status`            VARCHAR(20)  NOT NULL DEFAULT 'pending_payment' COMMENT '订单状态: pending_payment/pending_accept/delivering/completed/cancelled/pending_use',
    `address_id`        BIGINT       DEFAULT NULL COMMENT '收货地址ID',
    `address_detail`    VARCHAR(500) DEFAULT NULL COMMENT '收货地址详情',
    `buyer_remark`      VARCHAR(200) DEFAULT NULL COMMENT '买家备注',
    `coupon_id`         BIGINT       DEFAULT NULL COMMENT '使用的优惠券ID',
    `paid_at`           DATETIME     DEFAULT NULL COMMENT '支付时间',
    `completed_at`      DATETIME     DEFAULT NULL COMMENT '完成时间',
    `create_time`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_order_no` (`order_no`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_merchant_id` (`merchant_id`),
    KEY `idx_rider_id` (`rider_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- ============================================
-- 11. 订单明细表 (order_item)
-- ============================================
DROP TABLE IF EXISTS `order_item`;
CREATE TABLE `order_item` (
    `id`            BIGINT       NOT NULL COMMENT '明细ID',
    `order_id`      BIGINT       NOT NULL COMMENT '订单ID',
    `product_id`    BIGINT       NOT NULL COMMENT '商品ID',
    `name`          VARCHAR(100) NOT NULL COMMENT '商品名称(快照)',
    `price`         DECIMAL(10,2) NOT NULL COMMENT '商品价格(快照)',
    `quantity`      INT          NOT NULL DEFAULT 1 COMMENT '数量',
    `image`         VARCHAR(500) DEFAULT NULL COMMENT '商品图片',
    `spec_label`    VARCHAR(50)  DEFAULT NULL COMMENT '规格标签',
    `subtotal`      DECIMAL(10,2) NOT NULL COMMENT '小计金额',
    `reviewed`      TINYINT(1)   DEFAULT 0 COMMENT '是否已评价',
    `create_time`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_order_id` (`order_id`),
    KEY `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单明细表';

-- ============================================
-- 12. 团购券表 (group_coupon)
-- ============================================
DROP TABLE IF EXISTS `group_coupon`;
CREATE TABLE `group_coupon` (
    `id`            BIGINT      NOT NULL COMMENT '团购券ID',
    `order_id`      BIGINT      NOT NULL COMMENT '订单ID',
    `order_item_id` BIGINT      DEFAULT NULL COMMENT '订单明细ID',
    `code`          VARCHAR(10) NOT NULL COMMENT '6位核销码',
    `status`        VARCHAR(20) NOT NULL DEFAULT 'pending_use' COMMENT '状态: pending_use/used/expired',
    `expire_at`     DATETIME    DEFAULT NULL COMMENT '有效期',
    `used_at`       DATETIME    DEFAULT NULL COMMENT '使用时间',
    `create_time`   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_order_id` (`order_id`),
    KEY `idx_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='团购券表';

-- ============================================
-- 13. 支付记录表 (payment)
-- ============================================
DROP TABLE IF EXISTS `payment`;
CREATE TABLE `payment` (
    `id`             BIGINT       NOT NULL COMMENT '支付ID',
    `order_id`       BIGINT       NOT NULL COMMENT '订单ID',
    `amount`         DECIMAL(10,2) NOT NULL COMMENT '支付金额',
    `pay_method`     VARCHAR(20)  DEFAULT 'ALIPAY' COMMENT '支付方式: ALIPAY/WECHAT',
    `transaction_id` VARCHAR(100) DEFAULT NULL COMMENT '支付流水号',
    `status`         VARCHAR(20)  NOT NULL DEFAULT 'PENDING' COMMENT '支付状态: PENDING/SUCCESS/FAIL',
    `pay_time`       DATETIME     DEFAULT NULL COMMENT '支付时间',
    `create_time`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付记录表';

-- ============================================
-- 14. 评价表 (review)
-- ============================================
DROP TABLE IF EXISTS `review`;
CREATE TABLE `review` (
    `id`          BIGINT       NOT NULL COMMENT '评价ID',
    `order_id`    BIGINT       NOT NULL COMMENT '订单ID',
    `user_id`     BIGINT       NOT NULL COMMENT '用户ID',
    `merchant_id` BIGINT       NOT NULL COMMENT '商家ID',
    `product_id`  BIGINT       DEFAULT NULL COMMENT '商品ID',
    `rating`      TINYINT      NOT NULL DEFAULT 5 COMMENT '评分(1-5)',
    `content`     VARCHAR(500) DEFAULT NULL COMMENT '评价内容',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_order_id` (`order_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_merchant_id` (`merchant_id`),
    KEY `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评价表';

-- ============================================
-- 15. 收货地址表 (address)
-- ============================================
DROP TABLE IF EXISTS `address`;
CREATE TABLE `address` (
    `id`          BIGINT       NOT NULL COMMENT '地址ID',
    `user_id`     BIGINT       NOT NULL COMMENT '用户ID',
    `name`        VARCHAR(50)  NOT NULL COMMENT '收货人姓名',
    `phone`       VARCHAR(20)  NOT NULL COMMENT '手机号',
    `detail`      VARCHAR(255) NOT NULL COMMENT '详细地址',
    `longitude`   DECIMAL(10,7) DEFAULT NULL COMMENT '经度',
    `latitude`    DECIMAL(10,7) DEFAULT NULL COMMENT '纬度',
    `is_default`  TINYINT(1)   DEFAULT 0 COMMENT '是否默认地址',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收货地址表';

-- ============================================
-- 16. 优惠券模板表 (coupon)
-- ============================================
DROP TABLE IF EXISTS `coupon`;
CREATE TABLE `coupon` (
    `id`              BIGINT       NOT NULL COMMENT '优惠券ID',
    `name`            VARCHAR(100) NOT NULL COMMENT '优惠券名称',
    `discount`        DECIMAL(10,2) NOT NULL COMMENT '优惠金额',
    `threshold`       DECIMAL(10,2) NOT NULL COMMENT '满减门槛',
    `start_time`      DATETIME     NOT NULL COMMENT '有效开始时间',
    `end_time`        DATETIME     NOT NULL COMMENT '有效结束时间',
    `total_count`     INT          NOT NULL DEFAULT 0 COMMENT '发行总量',
    `claimed_count`   INT          NOT NULL DEFAULT 0 COMMENT '已领取数量',
    `limit_per_user`  INT          NOT NULL DEFAULT 1 COMMENT '每人限领数量',
    `status`          VARCHAR(20)  NOT NULL DEFAULT 'unreleased' COMMENT '状态: unreleased/released/ended',
    `create_time`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='优惠券模板表';

-- ============================================
-- 17. 用户优惠券表 (user_coupon)
-- ============================================
DROP TABLE IF EXISTS `user_coupon`;
CREATE TABLE `user_coupon` (
    `id`          BIGINT      NOT NULL COMMENT '记录ID',
    `user_id`     BIGINT      NOT NULL COMMENT '用户ID',
    `coupon_id`   BIGINT      NOT NULL COMMENT '优惠券ID',
    `status`      VARCHAR(20) NOT NULL DEFAULT 'unused' COMMENT '状态: unused/locked/used/expired',
    `claimed_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '领取时间',
    `used_at`     DATETIME    DEFAULT NULL COMMENT '使用时间',
    `order_id`    BIGINT      DEFAULT NULL COMMENT '使用的订单ID',
    `create_time` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_coupon_id` (`coupon_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户优惠券表';

-- ============================================
-- 18. 钱包记录表 (wallet_record)
-- ============================================
DROP TABLE IF EXISTS `wallet_record`;
CREATE TABLE `wallet_record` (
    `id`          BIGINT       NOT NULL COMMENT '记录ID',
    `user_type`   VARCHAR(20)  NOT NULL COMMENT '用户类型: merchant/rider',
    `user_id`     BIGINT       NOT NULL COMMENT '用户ID',
    `amount`      DECIMAL(10,2) NOT NULL COMMENT '金额(正收入/负支出)',
    `type`        VARCHAR(50)  NOT NULL COMMENT '业务类型: order_income/withdraw',
    `order_id`    BIGINT       DEFAULT NULL COMMENT '关联订单ID',
    `balance`     DECIMAL(10,2) DEFAULT 0.00 COMMENT '余额(快照)',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_user` (`user_type`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='钱包记录表';

-- ============================================
-- 19. 提现记录表 (withdraw)
-- ============================================
DROP TABLE IF EXISTS `withdraw`;
CREATE TABLE `withdraw` (
    `id`          BIGINT       NOT NULL COMMENT '提现ID',
    `user_type`   VARCHAR(20)  NOT NULL COMMENT '用户类型: merchant/rider',
    `user_id`     BIGINT       NOT NULL COMMENT '用户ID',
    `amount`      DECIMAL(10,2) NOT NULL COMMENT '提现金额',
    `method`      VARCHAR(50)  DEFAULT NULL COMMENT '收款方式',
    `status`      VARCHAR(20)  NOT NULL DEFAULT 'processing' COMMENT '状态: processing/paid/rejected',
    `apply_time`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
    `process_time` DATETIME    DEFAULT NULL COMMENT '处理时间',
    `create_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_user` (`user_type`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提现记录表';

-- ============================================
-- 20. 消息表 (message)
-- ============================================
DROP TABLE IF EXISTS `message`;
CREATE TABLE `message` (
    `id`            BIGINT       NOT NULL COMMENT '消息ID',
    `sender_id`     BIGINT       NOT NULL COMMENT '发送方ID',
    `sender_type`   VARCHAR(20)  NOT NULL COMMENT '发送方类型: user/merchant/rider',
    `receiver_id`   BIGINT       NOT NULL COMMENT '接收方ID',
    `receiver_type` VARCHAR(20)  NOT NULL COMMENT '接收方类型: user/merchant/rider',
    `order_id`      BIGINT       DEFAULT NULL COMMENT '关联订单ID',
    `content`       VARCHAR(500) NOT NULL COMMENT '消息内容',
    `is_read`       TINYINT(1)   DEFAULT 0 COMMENT '是否已读',
    `create_time`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
    PRIMARY KEY (`id`),
    KEY `idx_sender` (`sender_id`, `sender_type`),
    KEY `idx_receiver` (`receiver_id`, `receiver_type`),
    KEY `idx_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息表';

-- ============================================
-- 预设数据
-- ============================================

-- 预设管理员账号 (密码: admin123)
INSERT INTO `admin` (`id`, `username`, `password`) VALUES
(1, 'admin', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
(2, 'gl1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');
-- 注意: gl1 的密码占位符会在应用启动时由 CommandLineRunner 自动更新为正确的 BCrypt 哈希值

-- 预设分类
INSERT INTO `category` (`id`, `name`, `parent_id`, `sort_order`) VALUES
(1, '餐饮', NULL, 1),
(2, '休闲娱乐', NULL, 2),
(3, '生活服务', NULL, 3),
(4, '热销', 1, 1),
(5, '主食', 1, 2),
(6, '饮料', 1, 3),
(7, '甜品', 1, 4);

-- 预设测试用户 (密码: user123)
INSERT INTO `user` (`id`, `username`, `password`, `phone`, `nickname`, `role`, `status`) VALUES
(10001, 'testuser', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '13800138001', '测试用户', 'consumer', 'active'),
(10002, 'zhangsan', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '13800138007', '张三', 'consumer', 'active'),
(10003, 'lisi', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '13800138008', '李四', 'consumer', 'active');

-- 预设测试商家 (密码: merchant123)
INSERT INTO `merchant` (`id`, `username`, `password`, `name`, `phone`, `address`, `longitude`, `latitude`, `category`, `description`, `status`, `rating`, `monthly_sales`, `min_delivery_fee`, `delivery_fee`, `delivery_radius`) VALUES
(20001, 'merchant1', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '老王快餐', '13800138002', '北京市朝阳区建国路88号', 116.4600000, 39.9100000, '餐饮', '专注中式快餐20年，干净卫生，价格实惠', 'active', 4.5, 1280, 20.00, 5.00, 5),
(20002, 'merchant2', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '小李奶茶', '13800138003', '北京市海淀区中关村大街1号', 116.3100000, 39.9800000, '餐饮', '网红奶茶店，新鲜水果制作', 'active', 4.8, 2560, 15.00, 3.00, 3),
(20003, 'merchant3', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '张记饺子馆', '13800138004', '北京市西城区西单北大街88号', 116.3700000, 39.9100000, '餐饮', '手工水饺，现包现煮', 'active', 4.2, 860, 25.00, 5.00, 5),
(20004, 'merchant4', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '休闲网咖', '13800138005', '北京市朝阳区三里屯路19号', 116.4500000, 39.9300000, '休闲娱乐', '高端网咖，环境优雅', 'active', 4.0, 3200, 0.00, 0.00, 10),
(20005, 'merchant5', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '便民维修', '13800138006', '北京市丰台区方庄路18号', 116.4100000, 39.8600000, '生活服务', '家电维修、水电安装、开锁换锁', 'active', 4.6, 560, 0.00, 0.00, 10),
(20006, 'merchant6', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '川味轩', '13800138009', '北京市东城区王府井大街88号', 116.4100000, 39.9200000, '餐饮', '正宗川菜，麻辣鲜香', 'active', 4.7, 1890, 30.00, 5.00, 5),
(20007, 'merchant7', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '好利来蛋糕', '13800138010', '北京市朝阳区望京SOHO', 116.4800000, 39.9900000, '餐饮', '新鲜烘焙，甜蜜生活', 'active', 4.4, 980, 30.00, 8.00, 6),
(20008, 'merchant8', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '黄焖鸡米饭', '13800138011', '北京市海淀区五道口', 116.3400000, 39.9900000, '餐饮', '正宗黄焖鸡，汤汁浓郁', 'active', 4.3, 1560, 18.00, 3.00, 4),
(20009, 'merchant9', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '鲜果时光', '13800138012', '北京市朝阳区国贸CBD', 116.4600000, 39.9100000, '餐饮', '新鲜果汁，健康生活', 'active', 4.6, 2100, 10.00, 3.00, 3),
(20010, 'merchant10', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'KTV欢唱', '13800138013', '北京市海淀区五棵松', 116.2800000, 39.9100000, '休闲娱乐', '量贩式KTV，尽情欢唱', 'active', 3.8, 1500, 0.00, 0.00, 15);

-- 预设测试商品
INSERT INTO `product` (`id`, `merchant_id`, `category_id`, `name`, `description`, `price`, `stock`, `type`, `status`, `image`, `monthly_sales`) VALUES
(30001, 20001, 5, '鱼香肉丝饭', '经典川味鱼香肉丝搭配米饭', 22.00, 100, 'delivery', 'active', 'https://picsum.photos/seed/p1/400/300', 320),
(30002, 20001, 5, '宫保鸡丁饭', '正宗宫保鸡丁盖饭', 24.00, 100, 'delivery', 'active', 'https://picsum.photos/seed/p2/400/300', 280),
(30003, 20001, 6, '冰镇可乐', '可口可乐330ml', 3.00, 200, 'delivery', 'active', 'https://picsum.photos/seed/p3/400/300', 500),
(30004, 20001, 4, '红烧肉套餐', '红烧肉+时蔬+米饭+汤', 35.00, 50, 'delivery', 'active', 'https://picsum.photos/seed/p4/400/300', 180),
(30005, 20002, 6, '珍珠奶茶', '经典珍珠奶茶，奶香浓郁', 12.00, 200, 'delivery', 'active', 'https://picsum.photos/seed/p5/400/300', 800),
(30006, 20002, 6, '芒果冰沙', '新鲜芒果制作，清爽解暑', 18.00, 100, 'delivery', 'active', 'https://picsum.photos/seed/p6/400/300', 650),
(30007, 20002, 7, '提拉米苏', '意式经典甜点', 28.00, 30, 'delivery', 'active', 'https://picsum.photos/seed/p7/400/300', 120),
(30008, 20003, 5, '猪肉大葱饺子', '手工水饺(20个)', 28.00, 80, 'delivery', 'active', 'https://picsum.photos/seed/p8/400/300', 450),
(30009, 20003, 5, '韭菜鸡蛋饺子', '素馅水饺(20个)', 22.00, 80, 'delivery', 'active', 'https://picsum.photos/seed/p9/400/300', 380),
(30010, 20004, 2, '上网体验券(3小时)', '网咖3小时上网体验', 30.00, 50, 'group', 'active', 'https://picsum.photos/seed/p10/400/300', 200),
(30011, 20004, 2, '上网体验券(5小时)', '网咖5小时上网体验', 45.00, 30, 'group', 'active', 'https://picsum.photos/seed/p11/400/300', 150),
(30012, 20005, 3, '上门维修服务', '家电维修上门服务(不含配件)', 50.00, 20, 'group', 'active', 'https://picsum.photos/seed/p12/400/300', 80),
(30013, 20006, 5, '水煮鱼', '鲜嫩鱼片配麻辣汤底', 58.00, 50, 'delivery', 'active', 'https://picsum.photos/seed/p13/400/300', 560),
(30014, 20006, 5, '麻婆豆腐饭', '经典麻婆豆腐盖饭', 18.00, 100, 'delivery', 'active', 'https://picsum.photos/seed/p14/400/300', 420),
(30015, 20006, 6, '酸梅汤', '冰镇酸梅汤500ml', 8.00, 200, 'delivery', 'active', 'https://picsum.photos/seed/p15/400/300', 380),
(30016, 20007, 7, '奶油蛋糕(6寸)', '动物奶油，新鲜水果装饰', 88.00, 20, 'delivery', 'active', 'https://picsum.photos/seed/p16/400/300', 160),
(30017, 20007, 7, '蛋挞(4个装)', '酥脆蛋挞皮，嫩滑蛋液', 16.00, 50, 'delivery', 'active', 'https://picsum.photos/seed/p17/400/300', 320),
(30018, 20007, 6, '拿铁咖啡', '现磨咖啡，香浓顺滑', 22.00, 80, 'delivery', 'active', 'https://picsum.photos/seed/p18/400/300', 280),
(30019, 20008, 5, '黄焖鸡米饭(小份)', '经典黄焖鸡，配米饭', 18.00, 100, 'delivery', 'active', 'https://picsum.photos/seed/p19/400/300', 600),
(30020, 20008, 5, '黄焖鸡米饭(大份)', '经典黄焖鸡加量版，配米饭', 25.00, 80, 'delivery', 'active', 'https://picsum.photos/seed/p20/400/300', 450),
(30021, 20008, 6, '冰红茶', '冰镇红茶500ml', 5.00, 200, 'delivery', 'active', 'https://picsum.photos/seed/p21/400/300', 350),
(30022, 20009, 6, '鲜榨橙汁', '新鲜橙子现榨，富含维C', 15.00, 100, 'delivery', 'active', 'https://picsum.photos/seed/p22/400/300', 520),
(30023, 20009, 6, '西瓜汁', '当季西瓜鲜榨', 12.00, 100, 'delivery', 'active', 'https://picsum.photos/seed/p23/400/300', 480),
(30024, 20009, 7, '水果拼盘', '时令鲜果拼盘', 25.00, 30, 'delivery', 'active', 'https://picsum.photos/seed/p24/400/300', 200),
(30025, 20010, 2, '欢唱3小时套餐', 'KTV包厢3小时(含茶水)', 128.00, 20, 'group', 'active', 'https://picsum.photos/seed/p25/400/300', 180),
(30026, 20010, 2, '欢唱通宵套餐', 'KTV包厢通宵(含茶水小吃)', 198.00, 10, 'group', 'active', 'https://picsum.photos/seed/p26/400/300', 90);

-- 预设商品规格
INSERT INTO `spec_group` (`id`, `product_id`, `name`, `values`) VALUES
(1, 30001, '规格', '["大份(+3元)","小份"]'),
(2, 30005, '甜度', '["全糖","七分糖","三分糖","无糖"]'),
(3, 30005, '温度', '["热饮","常温","加冰"]'),
(4, 30019, '规格', '["加鸡腿(+5元)","标准"]'),
(5, 30022, '规格', '["大杯(+3元)","中杯"]');

INSERT INTO `product_spec` (`id`, `product_id`, `label`, `price`, `stock`) VALUES
(1, 30001, '大份', 3.00, 100),
(2, 30001, '小份', 0.00, 100),
(3, 30005, '全糖', 0.00, 200),
(4, 30005, '七分糖', 0.00, 200),
(5, 30005, '三分糖', 0.00, 200),
(6, 30005, '无糖', 0.00, 200),
(7, 30019, '加鸡腿', 5.00, 50),
(8, 30019, '标准', 0.00, 100),
(9, 30022, '大杯', 3.00, 100),
(10, 30022, '中杯', 0.00, 100);

-- 预设测试骑手 (密码: rider123)
INSERT INTO `rider` (`id`, `name`, `password`, `phone`, `id_card`, `status`, `service_area`) VALUES
(40001, '骑手小王', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '13900139001', '110101199001011234', 'active', '朝阳区'),
(40002, '骑手小李', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '13900139002', '110101199002021235', 'active', '海淀区'),
(40003, '骑手小张', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '13900139003', '110101199003031236', 'active', '西城区'),
(40004, '骑手小赵', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '13900139004', '110101199004041237', 'pending', '东城区');

-- 预设测试收货地址
INSERT INTO `address` (`id`, `user_id`, `name`, `phone`, `detail`, `longitude`, `latitude`, `is_default`) VALUES
(50001, 10001, '测试用户', '13800138001', '北京市朝阳区建国路100号京汇大厦', 116.4600000, 39.9100000, 1),
(50002, 10001, '测试用户(公司)', '13800138001', '北京市海淀区中关村大街1号', 116.3100000, 39.9800000, 0),
(50003, 10002, '张三', '13800138007', '北京市西城区金融街购物中心', 116.3600000, 39.9100000, 1),
(50004, 10003, '李四', '13800138008', '北京市东城区王府井大街200号', 116.4100000, 39.9200000, 1);

-- 预设优惠券模板
INSERT INTO `coupon` (`id`, `name`, `discount`, `threshold`, `start_time`, `end_time`, `total_count`, `claimed_count`, `limit_per_user`, `status`) VALUES
(60001, '新人专享券', 10.00, 30.00, '2025-01-01 00:00:00', '2025-12-31 23:59:59', 1000, 0, 1, 'released'),
(60002, '满50减15', 15.00, 50.00, '2025-01-01 00:00:00', '2025-12-31 23:59:59', 500, 0, 2, 'released'),
(60003, '满100减30', 30.00, 100.00, '2025-01-01 00:00:00', '2025-12-31 23:59:59', 200, 0, 1, 'released'),
(60004, '配送费减免', 5.00, 20.00, '2025-01-01 00:00:00', '2025-12-31 23:59:59', 500, 0, 3, 'released'),
(60005, '周末特惠', 8.00, 40.00, '2025-01-01 00:00:00', '2025-12-31 23:59:59', 300, 0, 1, 'released');

-- 预设用户优惠券
INSERT INTO `user_coupon` (`id`, `user_id`, `coupon_id`, `status`, `claimed_at`) VALUES
(70001, 10001, 60001, 'unused', NOW()),
(70002, 10001, 60002, 'unused', NOW()),
(70003, 10002, 60001, 'unused', NOW());
