package com.demo.orderservice.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.demo.orderservice.dto.OrderCreateRequest;
import com.demo.orderservice.dto.OrderUpdateRequest;
import com.demo.common.entity.ParkingOrder;

public interface IParkingOrderService extends IService<ParkingOrder> {
    /**
     * 入场：创建订单，更新停车场剩余车位
     *
     * @param userId
     * @param request 入场请求
     * @return 生成的订单ID
     */
    Long createOrder(Long userId, OrderCreateRequest request);

    /**
     * 离场：计算费用，更新订单状态和停车场剩余车位
     *
     * @param userId
     * @param request 离场请求
     * @return 更新后的订单对象
     */
    ParkingOrder completeOrder(Long userId, OrderUpdateRequest request);

    IPage<ParkingOrder> getParkingOrdersByUserId(Long userId, int pageNum, int pageSize);
}
