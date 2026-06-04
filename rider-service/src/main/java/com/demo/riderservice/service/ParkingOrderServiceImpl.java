package com.demo.orderservice.service;


import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.demo.common.dto.DecrementRequest;
import com.demo.common.dto.IncrementRequest;
import com.demo.common.entity.ParkingLot;
import com.demo.common.exception.BusinessException;
import com.demo.orderservice.exception.OrderBusinessException;
import com.demo.parkingapi.feign.ParkingFeignClient;
import com.demo.orderservice.dto.OrderCreateRequest;
import com.demo.orderservice.dto.OrderUpdateRequest;
import com.demo.common.entity.ParkingOrder;
import com.demo.orderservice.mapper.ParkingOrderMapper;
import feign.FeignException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;

@Service
public class ParkingOrderServiceImpl extends ServiceImpl<ParkingOrderMapper, ParkingOrder> implements IParkingOrderService {
    @Autowired
    private ParkingFeignClient parkingFeignClient;

    @Override
    @Transactional
    public Long createOrder(Long userId, OrderCreateRequest request) {
        // 1. 检查停车场是否存在且有空余车位
        ParkingLot lot = null;
        try {
            lot = parkingFeignClient.getById(request.getLotId());
        } catch (BusinessException e) {
            // 业务异常，可转换为特定错误码
            throw new OrderBusinessException(e.getCode(), e.getMessage());
        } catch (FeignException e) {
            // Feign 底层异常（网络超时等）
            throw new OrderBusinessException(500, "服务调用失败");
        }catch(Exception e){
            throw new RuntimeException(e.getMessage());
        }


        if (lot == null) {
            throw new BusinessException(404,"停车场不存在");
        }
        if (lot.getAvailableSpaces() <= 0) {
            throw new BusinessException(409,"停车场已满");
        }

        // 2. 创建订单
        ParkingOrder order = new ParkingOrder();
        order.setUserId(userId);
        order.setLotId(request.getLotId());
        order.setPlateNumber(request.getPlateNumber());
        order.setEnterTime(LocalDateTime.now());
        order.setStatus(0); // 进行中
        order.setAmount(BigDecimal.ZERO);
        save(order);

        // 3. 更新停车场剩余车位（减1），使用乐观锁保证原子性
        boolean success = false;
        try {
            success = parkingFeignClient.decrementAvailable(new DecrementRequest(lot.getId()));
        }  catch (BusinessException e) {
            // 业务异常，可转换为特定错误码
            throw new OrderBusinessException(e.getCode(), e.getMessage());
        } catch (FeignException e) {
            // Feign 底层异常（网络超时等）
            throw new OrderBusinessException(500, "服务调用失败");
        }catch(Exception e){
            throw new RuntimeException(e.getMessage());
        }

        if (!success) {
            throw new RuntimeException("更新车位失败，车位可能已被占用");
        }

        return order.getId();
    }

    @Override
    @Transactional
    public ParkingOrder completeOrder(Long userId, OrderUpdateRequest request) {
        // 1. 查询订单
        ParkingOrder order = getById(request.getOrderId());
        if (order == null) {
            throw new BusinessException(404,"订单不存在");
        }
        if(!order.getUserId().equals(userId)){
            throw new BusinessException(409,"订单不属于当前用户");
        }
        if (order.getStatus() != 0) {
            throw new BusinessException(409,"订单不是进行中状态");
        }

        // 2. 设置离场时间
        LocalDateTime exitTime = LocalDateTime.now();
        order.setExitTime(exitTime);

        // 3. 查询关联停车场获取费率
        ParkingLot lot = null;
        try {
            lot = parkingFeignClient.getById(order.getLotId());
        }catch (BusinessException e) {
            // 业务异常，可转换为特定错误码
            throw new OrderBusinessException(e.getCode(), e.getMessage());
        } catch (FeignException e) {
            // Feign 底层异常（网络超时等）
            throw new OrderBusinessException(500, "服务调用失败");
        }catch(Exception e){
            throw new RuntimeException(e.getMessage());
        }

        if (lot == null) {
            throw new BusinessException(404,"关联的停车场不存在");
        }

        // 4. 计算费用（按小时向上取整）
        long minutes = Duration.between(order.getEnterTime(), exitTime).toMinutes();
        long hours = (minutes + 59) / 60; // 不足1小时按1小时算
        BigDecimal amount = lot.getFeeRate().multiply(BigDecimal.valueOf(hours));
        order.setAmount(amount);

        // 5. 更新订单状态为已完成
        order.setStatus(1);
        updateById(order);

        // 6. 更新停车场剩余车位（加1）
        boolean success = false;
        try {
            success = parkingFeignClient.incrementAvailable(new IncrementRequest(order.getLotId()));
        } catch (BusinessException e) {
            // 业务异常，可转换为特定错误码
            throw new OrderBusinessException(e.getCode(), e.getMessage());
        } catch (FeignException e) {
            // Feign 底层异常（网络超时等）
            throw new OrderBusinessException(500, "服务调用失败");
        }catch(Exception e){
            throw new RuntimeException(e.getMessage());
        }

        if (!success) {
            throw new BusinessException(500,"更新车位失败");
        }

        return order;
    }

    @Override
    public IPage<ParkingOrder> getParkingOrdersByUserId(Long userId, int pageNum, int pageSize) {
        // 创建分页对象
        Page<ParkingOrder> page = new Page<>(pageNum, pageSize);
        // 使用 lambdaQuery 进行分页查询，按创建时间倒序排列
        return lambdaQuery()
                .eq(ParkingOrder::getUserId,userId)
                .orderByDesc(ParkingOrder::getCreateTime)
                .page(page);
    }
}
