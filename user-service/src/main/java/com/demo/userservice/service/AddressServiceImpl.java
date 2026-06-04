package com.demo.userservice.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.demo.common.entity.Address;
import com.demo.userservice.mapper.AddressMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class AddressServiceImpl extends ServiceImpl<AddressMapper, Address> implements IAddressService {
    @Override
    public List<Address> getAddressesByUserId(Long userId) {
        return this.list(new LambdaQueryWrapper<Address>().eq(Address::getUserId, userId));
    }

    @Override
    @Transactional
    public void setDefaultAddress(Long userId, Long addressId) {
        // 先将该用户所有地址设为非默认
        this.update(new LambdaQueryWrapper<Address>().eq(Address::getUserId, userId)
                .set(Address::getIsDefault, false));
        // 再将指定地址设为默认
        Address address = this.getById(addressId);
        if (address != null && address.getUserId().equals(userId)) {
            address.setIsDefault(true);
            this.updateById(address);
        }
    }
}