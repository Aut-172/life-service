package com.demo.riderservice.controller;

import com.demo.common.dto.Response;
import com.demo.common.entity.Rider;
import com.demo.riderservice.service.IRiderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rider")
public class RiderController {

    @Autowired
    private IRiderService riderService;

    // 骑手查看自己的信息
    @GetMapping("/profile")
    public Response<Rider> getProfile() {
        Long riderId = getCurrentRiderId();
        return Response.success(riderService.getById(riderId));
    }

    @PutMapping("/profile")
    public Response<Boolean> updateProfile(@RequestBody Rider rider) {
        rider.setRiderId(getCurrentRiderId());
        return Response.success(riderService.updateById(rider));
    }

    // 管理员：所有骑手列表
    @GetMapping("/admin/riders")
    public Response<List<Rider>> listRiders(@RequestParam(required = false) Integer status) {
        List<Rider> list = riderService.list(new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<Rider>()
                .eq(status != null, Rider::getRiderStatus, status));
        return Response.success(list);
    }

    // 管理员审核骑手
    @PutMapping("/admin/rider/status")
    public Response<Boolean> auditRider(@RequestParam Long riderId, @RequestParam Integer status, @RequestParam(required = false) String remark) {
        return Response.success(riderService.updateStatus(riderId, status, remark));
    }

    private Long getCurrentRiderId() {
        return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}