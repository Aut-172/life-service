package com.demo.orderservice.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.demo.common.entity.ParkingOrder;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ParkingOrderMapper extends BaseMapper<ParkingOrder> {
}
