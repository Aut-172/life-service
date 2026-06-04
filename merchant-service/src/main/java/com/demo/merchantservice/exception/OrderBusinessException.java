package com.demo.orderservice.exception;

import com.demo.common.exception.BusinessException;

public class OrderBusinessException extends BusinessException {
    private final int code;
    public OrderBusinessException(int code, String message) {
        super(code,message);
        this.code = code;
    }
    public int getCode() { return code; }
}