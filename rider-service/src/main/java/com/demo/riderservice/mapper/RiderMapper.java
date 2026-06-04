package com.demo.riderservice.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.demo.common.entity.Rider;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface RiderMapper extends BaseMapper<Rider> {
}