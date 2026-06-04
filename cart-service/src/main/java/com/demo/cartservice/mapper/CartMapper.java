package com.demo.cartservice.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.demo.common.entity.Cart;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface CartMapper extends BaseMapper<Cart> {
}