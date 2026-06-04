package com.demo.userservice.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.demo.common.entity.Address;
import java.util.List;

public interface IAddressService extends IService<Address> {
    List<Address> getAddressesByUserId(Long userId);
    void setDefaultAddress(Long userId, Long addressId);
}