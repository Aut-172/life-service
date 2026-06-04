package com.demo.walletservice.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.demo.common.entity.Withdraw;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface WithdrawMapper extends BaseMapper<Withdraw> {
}