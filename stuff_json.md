 "/api/hr/employees": {
            "get": {
                "tags": [
                    "Employees"
                ],
                "summary": "عرض موظفي الشركة الحالية فقط (مع Pagination/Search/Sort/Filter)",
                "operationId": "fc5fc45c40672bbb65a61eef8b942dae",
                "parameters": [
                    {
                        "name": "page",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer"
                        }
                    },
                    {
                        "name": "per_page",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "default": 15
                        }
                    },
                    {
                        "name": "search",
                        "in": "query",
                        "description": "بحث في الاسم والإيميل والمسمى الوظيفي",
                        "required": false,
                        "schema": {
                            "type": "string"
                        }
                    },
                    {
                        "name": "department_id",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "string",
                            "format": "uuid"
                        }
                    },
                    {
                        "name": "is_active",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "boolean"
                        }
                    },
                    {
                        "name": "sort_by",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "string",
                            "default": "hire_date"
                        }
                    },
                    {
                        "name": "sort_dir",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "string",
                            "default": "desc"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "قائمة الموظفين",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "properties": {
                                        "success": {
                                            "type": "boolean",
                                            "example": true
                                        },
                                        "data": {
                                            "properties": {
                                                "current_page": {
                                                    "type": "integer"
                                                },
                                                "data": {
                                                    "type": "array",
                                                    "items": {
                                                        "type": "object"
                                                    }
                                                },
                                                "total": {
                                                    "type": "integer"
                                                },
                                                "per_page": {
                                                    "type": "integer"
                                                }
                                            },
                                            "type": "object"
                                        }
                                    },
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Unauthenticated"
                    },
                    "403": {
                        "description": "Forbidden (HR Manager only)"
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            },
            "post": {
                "tags": [
                    "Employees"
                ],
                "summary": "إضافة موظف فردي (إنشاء user + employee داخل Transaction)",
                "operationId": "75b0f2c94396214c038fd5e6876863bd",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "required": [
                                    "full_name",
                                    "email",
                                    "department_id",
                                    "job_title",
                                    "base_salary",
                                    "hire_date"
                                ],
                                "properties": {
                                    "full_name": {
                                        "type": "string",
                                        "example": "Ahmad Ali"
                                    },
                                    "email": {
                                        "type": "string",
                                        "format": "email",
                                        "example": "ahmad@example.com"
                                    },
                                    "phone": {
                                        "description": "يجب أن يبدأ بـ 09 ويتكون من 10 أرقام",
                                        "type": "string",
                                        "pattern": "^09[0-9]{8}$",
                                        "example": "0999999999"
                                    },
                                    "department_id": {
                                        "type": "string",
                                        "format": "uuid"
                                    },
                                    "education": {
                                        "type": "string",
                                        "example": "BSc"
                                    },
                                    "job_title": {
                                        "type": "string",
                                        "example": "Engineer"
                                    },
                                    "base_salary": {
                                        "type": "number",
                                        "example": 1500
                                    },
                                    "hire_date": {
                                        "description": "لا يمكن أن يكون تاريخاً مستقبلياً",
                                        "type": "string",
                                        "format": "date",
                                        "example": "2026-01-01"
                                    },
                                    "employment_type": {
                                        "type": "string",
                                        "example": "full-time"
                                    },
                                    "is_active": {
                                        "type": "boolean",
                                        "example": true
                                    },
                                    "gender": {
                                        "type": "string",
                                        "enum": [
                                            "male",
                                            "female"
                                        ],
                                        "nullable": true
                                    },
                                    "marital_status": {
                                        "type": "string",
                                        "enum": [
                                            "single",
                                            "married",
                                            "divorced",
                                            "widowed"
                                        ],
                                        "nullable": true
                                    },
                                    "nationality": {
                                        "type": "string",
                                        "example": "Syrian",
                                        "nullable": true
                                    },
                                    "residence": {
                                        "type": "string",
                                        "example": "Damascus, Syria",
                                        "nullable": true
                                    }
                                },
                                "type": "object"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "تم إنشاء الموظف",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object"
                                        }
                                    },
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation failed"
                    },
                    "403": {
                        "description": "Forbidden (HR Manager only)"
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            }
        },
        "/api/hr/employees/{employee}": {
            "get": {
                "tags": [
                    "Employees"
                ],
                "summary": "عرض تفاصيل موظف تابع للشركة الحالية",
                "operationId": "e96e324f2c04a33bbaab533696ccf640",
                "parameters": [
                    {
                        "name": "employee",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "format": "uuid"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "تفاصيل الموظف"
                    },
                    "404": {
                        "description": "Not found / not in your company"
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            },
            "put": {
                "tags": [
                    "Employees"
                ],
                "summary": "تعديل بيانات موظف (user + employee) داخل Transaction",
                "operationId": "09a2ecf422bb8343bda87139ef5a6166",
                "parameters": [
                    {
                        "name": "employee",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "format": "uuid"
                        }
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "properties": {
                                    "full_name": {
                                        "type": "string",
                                        "example": "Ahmad Ali Updated"
                                    },
                                    "email": {
                                        "type": "string",
                                        "format": "email",
                                        "example": "ahmad2@example.com"
                                    },
                                    "phone": {
                                        "description": "يجب أن يبدأ بـ 09 ويتكون من 10 أرقام",
                                        "type": "string",
                                        "pattern": "^09[0-9]{8}$",
                                        "example": "0999999999"
                                    },
                                    "department_id": {
                                        "type": "string",
                                        "format": "uuid"
                                    },
                                    "education": {
                                        "type": "string"
                                    },
                                    "job_title": {
                                        "type": "string"
                                    },
                                    "base_salary": {
                                        "type": "number"
                                    },
                                    "hire_date": {
                                        "description": "لا يمكن أن يكون تاريخاً مستقبلياً",
                                        "type": "string",
                                        "format": "date"
                                    },
                                    "employment_type": {
                                        "type": "string"
                                    },
                                    "is_active": {
                                        "type": "boolean"
                                    },
                                    "gender": {
                                        "type": "string",
                                        "enum": [
                                            "male",
                                            "female"
                                        ],
                                        "nullable": true
                                    },
                                    "marital_status": {
                                        "type": "string",
                                        "enum": [
                                            "single",
                                            "married",
                                            "divorced",
                                            "widowed"
                                        ],
                                        "nullable": true
                                    },
                                    "nationality": {
                                        "type": "string",
                                        "nullable": true
                                    },
                                    "residence": {
                                        "type": "string",
                                        "nullable": true
                                    }
                                },
                                "type": "object"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "تم التعديل"
                    },
                    "404": {
                        "description": "Not found / not in your company"
                    },
                    "422": {
                        "description": "Validation failed"
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            },
            "delete": {
                "tags": [
                    "Employees"
                ],
                "summary": "حذف موظف مع حسابه المرتبط (لتفادي بيانات يتيمة)",
                "description": "إذا كان للموظف أي سجلات تاريخية مرتبطة (حضور، إجازات، رواتب، سُلف، إضافي، تقييمات) لا يتم الحذف إطلاقاً - يتم تجميد حسابه (is_active=false) بدلاً من ذلك ويُرجع 409.",
                "operationId": "6fafa4a468fde3b5be572c079eade380",
                "parameters": [
                    {
                        "name": "employee",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "format": "uuid"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "تم الحذف"
                    },
                    "403": {
                        "description": "Cannot delete: user is a General Manager or Super Admin"
                    },
                    "404": {
                        "description": "Not found / not in your company"
                    },
                    "409": {
                        "description": "لا يمكن الحذف بسبب وجود سجلات مرتبطة - تم تجميد الموظف بدلاً من ذلك",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "properties": {
                                        "success": {
                                            "type": "boolean",
                                            "example": false
                                        },
                                        "message": {
                                            "type": "string",
                                            "example": "لا يمكن حذف الموظف لأنه يمتلك سجلات مرتبطة بالنظام. تم تجميد حسابه بدلاً من ذلك."
                                        }
                                    },
                                    "type": "object"
                                }
                            }
                        }
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            }
        },
        "/api/hr/employees/import": {
            "post": {
                "tags": [
                    "Employees"
                ],
                "summary": "استيراد موظفين من ملف Excel/CSV (All-or-nothing: إن وُجد خطأ لا يُدخل أي صف)",
                "description": "بالإضافة للأعمدة الأساسية، يدعم الملف أعمدة اختيارية إضافية تُحفظ مباشرة عند إنشاء المستخدم: gender (male/female)، marital_status (single/married/divorced/widowed)، nationality، residence. صور الملف الشخصي/الهوية/الشهادة الجامعية لا تُستورد من الإكسل ويرفعها الموظف لاحقاً بنفسه.",
                "operationId": "6a70e41774051a7604e34cb286a1b210",
                "requestBody": {
                    "required": true,
                    "content": {
                        "multipart/form-data": {
                            "schema": {
                                "properties": {
                                    "file": {
                                        "type": "string",
                                        "format": "binary"
                                    }
                                },
                                "type": "object"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "تم الاستيراد",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "count": {
                                            "type": "integer"
                                        }
                                    },
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "أخطاء في الصفوف",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "properties": {
                                        "success": {
                                            "type": "boolean",
                                            "example": false
                                        },
                                        "errors": {
                                            "type": "object"
                                        }
                                    },
                                    "type": "object"
                                }
                            }
                        }
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            }
        },
        "/api/hr/employees/import/template": {
            "get": {
                "tags": [
                    "Employees"
                ],
                "summary": "تحميل قالب Excel جاهز لاستيراد الموظفين",
                "operationId": "1a92c978b39c2171a693a6b80d1ec12e",
                "responses": {
                    "200": {
                        "description": "ملف xlsx",
                        "content": {
                            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {}
                        }
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            }
        },


////////////////***** HR  ********//

 "/api/companies/{company}/hr-managers": {
            "get": {
                "tags": [
                    "HR Managers"
                ],
                "summary": "List HR managers for a company",
                "operationId": "e02140525938c18f8c8dd51df87c2aad",
                "parameters": [
                    {
                        "name": "company",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "format": "uuid"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "List of HR managers",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "properties": {
                                        "success": {
                                            "type": "boolean",
                                            "example": true
                                        },
                                        "data": {
                                            "type": "array",
                                            "items": {
                                                "type": "object"
                                            }
                                        }
                                    },
                                    "type": "object"
                                }
                            }
                        }
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            },
            "post": {
                "tags": [
                    "HR Managers"
                ],
                "summary": "Create a new HR manager for a company",
                "operationId": "e8d4293b28ae39e42ff3c442de73fe78",
                "parameters": [
                    {
                        "name": "company",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "format": "uuid"
                        }
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "required": [
                                    "full_name",
                                    "email",
                                    "department_id",
                                    "job_title",
                                    "base_salary",
                                    "hire_date"
                                ],
                                "properties": {
                                    "full_name": {
                                        "type": "string",
                                        "example": "Sarah Ahmed"
                                    },
                                    "email": {
                                        "type": "string",
                                        "format": "email",
                                        "example": "sarah@company.com"
                                    },
                                    "phone": {
                                        "description": "يجب أن يبدأ بـ 09 ويتكون من 10 أرقام",
                                        "type": "string",
                                        "pattern": "^09[0-9]{8}$",
                                        "example": "0999888777"
                                    },
                                    "education": {
                                        "type": "string",
                                        "example": "Bachelor of Business Administration"
                                    },
                                    "job_title": {
                                        "type": "string",
                                        "example": "HR Manager"
                                    },
                                    "base_salary": {
                                        "type": "number",
                                        "format": "float",
                                        "example": 1200.5
                                    },
                                    "hire_date": {
                                        "description": "لا يمكن أن يكون تاريخاً مستقبلياً",
                                        "type": "string",
                                        "format": "date",
                                        "example": "2026-07-01"
                                    },
                                    "employment_type": {
                                        "type": "string",
                                        "example": "full-time"
                                    },
                                    "is_active": {
                                        "type": "boolean",
                                        "example": true
                                    },
                                    "gender": {
                                        "type": "string",
                                        "enum": [
                                            "male",
                                            "female"
                                        ],
                                        "nullable": true
                                    },
                                    "marital_status": {
                                        "type": "string",
                                        "enum": [
                                            "single",
                                            "married",
                                            "divorced",
                                            "widowed"
                                        ],
                                        "nullable": true
                                    },
                                    "nationality": {
                                        "type": "string",
                                        "example": "Syrian",
                                        "nullable": true
                                    },
                                    "residence": {
                                        "type": "string",
                                        "example": "Damascus, Syria",
                                        "nullable": true
                                    }
                                },
                                "type": "object"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "HR manager created successfully",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "properties": {
                                        "success": {
                                            "type": "boolean",
                                            "example": true
                                        },
                                        "message": {
                                            "type": "string",
                                            "example": "HR manager created successfully."
                                        },
                                        "data": {
                                            "properties": {
                                                "hr_manager": {
                                                    "type": "object"
                                                }
                                            },
                                            "type": "object"
                                        }
                                    },
                                    "type": "object"
                                }
                            }
                        }
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            }
        },
        "/api/companies/{company}/hr-managers/{hr_manager}": {
            "get": {
                "tags": [
                    "HR Managers"
                ],
                "summary": "Get HR manager details",
                "operationId": "2bdf6b7d11fc504d3f6bb270360c0b68",
                "parameters": [
                    {
                        "name": "company",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "format": "uuid"
                        }
                    },
                    {
                        "name": "hr_manager",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "format": "uuid"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "HR manager details",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "properties": {
                                        "success": {
                                            "type": "boolean",
                                            "example": true
                                        },
                                        "data": {
                                            "type": "object"
                                        }
                                    },
                                    "type": "object"
                                }
                            }
                        }
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            },
            "put": {
                "tags": [
                    "HR Managers"
                ],
                "summary": "Update an existing HR manager",
                "operationId": "24aa33c3d498057f191ce81e6a3938b1",
                "parameters": [
                    {
                        "name": "company",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "format": "uuid"
                        }
                    },
                    {
                        "name": "hr_manager",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "format": "uuid"
                        }
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "properties": {
                                    "full_name": {
                                        "type": "string",
                                        "example": "Sarah Ahmed"
                                    },
                                    "email": {
                                        "type": "string",
                                        "format": "email",
                                        "example": "sarah@company.com"
                                    },
                                    "phone": {
                                        "description": "يجب أن يبدأ بـ 09 ويتكون من 10 أرقام",
                                        "type": "string",
                                        "pattern": "^09[0-9]{8}$",
                                        "example": "0999888777"
                                    },
                                    "department_id": {
                                        "type": "string",
                                        "format": "uuid",
                                        "example": "123e4567-e89b-12d3-a456-426614174000"
                                    },
                                    "education": {
                                        "type": "string",
                                        "example": "Bachelor of Business Administration"
                                    },
                                    "job_title": {
                                        "type": "string",
                                        "example": "HR Manager"
                                    },
                                    "base_salary": {
                                        "type": "number",
                                        "format": "float",
                                        "example": 1200.5
                                    },
                                    "hire_date": {
                                        "description": "لا يمكن أن يكون تاريخاً مستقبلياً",
                                        "type": "string",
                                        "format": "date",
                                        "example": "2026-07-01"
                                    },
                                    "employment_type": {
                                        "type": "string",
                                        "example": "full-time"
                                    },
                                    "is_active": {
                                        "type": "boolean",
                                        "example": true
                                    },
                                    "gender": {
                                        "type": "string",
                                        "enum": [
                                            "male",
                                            "female"
                                        ],
                                        "nullable": true
                                    },
                                    "marital_status": {
                                        "type": "string",
                                        "enum": [
                                            "single",
                                            "married",
                                            "divorced",
                                            "widowed"
                                        ],
                                        "nullable": true
                                    },
                                    "nationality": {
                                        "type": "string",
                                        "example": "Syrian",
                                        "nullable": true
                                    },
                                    "residence": {
                                        "type": "string",
                                        "example": "Damascus, Syria",
                                        "nullable": true
                                    }
                                },
                                "type": "object"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "HR manager updated successfully",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "properties": {
                                        "success": {
                                            "type": "boolean",
                                            "example": true
                                        },
                                        "message": {
                                            "type": "string",
                                            "example": "HR manager updated successfully."
                                        },
                                        "data": {
                                            "type": "object"
                                        }
                                    },
                                    "type": "object"
                                }
                            }
                        }
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                     ]
            },
            "delete": {
                "tags": [
                    "HR Managers"
                ],
                "summary": "Delete an HR manager",
                "operationId": "d1cfade904f402f80b88dd18d62c5714",
                "parameters": [
                    {
                        "name": "company",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "format": "uuid"
                        }
                    },
                    {
                        "name": "hr_manager",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "format": "uuid"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "HR manager deleted successfully",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "properties": {
                                        "success": {
                                            "type": "boolean",
                                            "example": true
                                        },
                                        "message": {
                                            "type": "string",
                                            "example": "HR manager deleted successfully."
                                        }
                                    },
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "409": {
                        "description": "Cannot delete: self-deletion, last remaining HR manager, or existing historical records (frozen instead)",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "properties": {
                                        "success": {
                                            "type": "boolean",
                                            "example": false
                                        },
                                        "message": {
                                            "type": "string",
                                            "example": "لا يمكن حذف آخر مدير موارد بشرية في الشركة."
                                        }
                                    },
                                    "type": "object"
                                }
                            }
                        }
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            }
        },
        "/api/companies/{company}/hr-managers/{hr_manager}/activate": {
            "post": {
                "tags": [
                    "HR Managers"
                ],
                "summary": "Activate an HR manager account",
                "operationId": "d8fa2d34c789eb055de3b71df7974529",
                "parameters": [
                    {
                        "name": "company",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "format": "uuid"
                        }
                    },
                    {
                        "name": "hr_manager",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "format": "uuid"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "HR manager activated successfully",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "properties": {
                                        "success": {
                                            "type": "boolean",
                                            "example": true
                                        },
                                        "message": {
                                            "type": "string",
                                            "example": "HR manager activated successfully."
                                        }
                                    },
                                    "type": "object"
                                }
                            }
                        }
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            }
        },
        "/api/companies/{company}/hr-managers/{hr_manager}/deactivate": {
            "post": {
                "tags": [
                    "HR Managers"
                ],
                "summary": "Deactivate an HR manager account",
                "operationId": "c1c1880bbc9e27fff6a1fcabd9de9723",
                "parameters": [
                    {
                        "name": "company",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "format": "uuid"
                        }
                    },
                    {
                        "name": "hr_manager",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "format": "uuid"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "HR manager deactivated successfully",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "properties": {
                                        "success": {
                                            "type": "boolean",
                                            "example": true
                                        },
                                        "message": {
                                            "type": "string",
                                            "example": "HR manager deactivated successfully."
                                        }
                                    },
                                    "type": "object"
                                }
                            }
                        }
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            }
        },
       
          

    /////***  department */

     PUT
/api/hr/departments/{department} (http://127.0.0.1:8000/api/documentation#/Departments/9b8875f5e87d5473328f54be46054c38)
تعديل قسم تابع للشركة الحالية
 بتضيفي مدير للقسم بحيث انو بتعدلي القسم وبتختاريلو مدير من الموظفين الموجودين ضمن نفس القسم
ولبعدين ارا رجعتي غيرتي مدير القسم 
فالقديم بصير موظف بشكل تلقائي من الباك اند وبيتعين الجديد 

GET
/api/hr/departments/{department}/employees (http://127.0.0.1:8000/api/documentation#/Employees/9a90f6c3af1ee4c13fcd1886ed22532a)
عرض موظفي قسم محدد ضمن الشركة الحالية فقط (مع Pagination/Search/Sort/Filter)
مشان اختار منهن مدير للقسم

 "/api/hr/departments/{department}/employees": {
            "get": {
                "tags": [
                    "Employees"
                ],
                "summary": "عرض موظفي قسم محدد ضمن الشركة الحالية فقط (مع Pagination/Search/Sort/Filter)",
                "operationId": "9a90f6c3af1ee4c13fcd1886ed22532a",
                "parameters": [
                    {
                        "name": "department",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "format": "uuid"
                        }
                    },
                    {
                        "name": "page",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer"
                        }
                    },
                    {
                        "name": "per_page",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "integer",
                            "default": 15
                        }
                    },
                    {
                        "name": "search",
                        "in": "query",
                        "description": "بحث في الاسم والإيميل والمسمى الوظيفي",
                        "required": false,
                        "schema": {
                            "type": "string"
                        }
                    },
                    {
                        "name": "is_active",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "boolean"
                        }
                    },
                    {
                        "name": "sort_by",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "string",
                            "default": "hire_date"
                        }
                    },
                    {
                        "name": "sort_dir",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "string",
                            "default": "desc"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "قائمة موظفي القسم (نفس شكل استجابة GET /api/hr/employees)",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "properties": {
                                        "success": {
                                            "type": "boolean",
                                            "example": true
                                        },
                                        "data": {
                                            "type": "array",
                                            "items": {
                                                "type": "object"
                                            }
                                        }
                                    },
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Unauthenticated"
                    },
                    "403": {
                        "description": "Forbidden (HR Manager or General Manager only)"
                    },
                    "404": {
                        "description": "Department not found / not in your company"
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            }
        },


 "/api/hr/departments": {
            "get": {
                "tags": [
                    "Departments"
                ],
                "summary": "عرض أقسام الشركة الحالية فقط",
                "operationId": "c36fee8cae84f6e3f84340b5ab6816c4",
                "parameters": [
                    {
                        "name": "search",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "string"
                        }
                    },
                    {
                        "name": "is_active",
                        "in": "query",
                        "required": false,
                        "schema": {
                            "type": "boolean"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "قائمة الأقسام",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "properties": {
                                        "success": {
                                            "type": "boolean",
                                            "example": true
                                        },
                                        "data": {
                                            "type": "array",
                                            "items": {
                                                "type": "object"
                                            }
                                        }
                                    },
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Unauthenticated"
                    },
                    "403": {
                        "description": "Forbidden (HR Manager only)"
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            },
            "post": {
                "tags": [
                    "Departments"
                ],
                "summary": "إضافة قسم جديد للشركة الحالية",
                "operationId": "7ce1223ef7aab3fe512a7a44bef03d7e",
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "required": [
                                    "name"
                                ],
                                "properties": {
                                    "name": {
                                        "type": "string",
                                        "example": "IT"
                                    },
                                    "is_active": {
                                        "type": "boolean",
                                        "example": true
                                    },
                                    "manager_id": {
                                        "description": "Must be an employee id belonging to the current company and not already the manager of another department. Setting it promotes that employee's account to Department Manager.",
                                        "type": "string",
                                        "format": "uuid",
                                        "nullable": true
                                    }
                                },
                                "type": "object"
                            }
                        }
                    }
                },
                "responses": {
                    "201": {
                        "description": "تم إنشاء القسم",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "properties": {
                                        "success": {
                                            "type": "boolean"
                                        },
                                        "data": {
                                            "type": "object"
                                        }
                                    },
                                    "type": "object"
                                }
                            }
                        }
                    },
                    "422": {
                        "description": "Validation failed (including manager_id belonging to another company, or already managing a different department)"
                    },
                    "403": {
                        "description": "Forbidden (HR Manager only), or the company is frozen (status=suspended) - message 'Company is frozen.'"
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            }
        },
        "/api/hr/departments/{department}": {
            "get": {
                "tags": [
                    "Departments"
                ],
                "summary": "عرض تفاصيل قسم تابع للشركة الحالية",
                "operationId": "b56928861e4b7524292fa27b2fac03e4",
                "parameters": [
                    {
                        "name": "department",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "format": "uuid"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "تفاصيل القسم"
                    },
                    "404": {
                        "description": "Not found / not in your company"
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            },
            "put": {
                "tags": [
                    "Departments"
                ],
                "summary": "تعديل قسم تابع للشركة الحالية",
                "operationId": "9b8875f5e87d5473328f54be46054c38",
                "parameters": [
                    {
                        "name": "department",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "format": "uuid"
                        }
                    }
                ],
                "requestBody": {
                    "required": true,
                    "content": {
                        "application/json": {
                            "schema": {
                                "properties": {
                                    "name": {
                                        "type": "string",
                                        "example": "IT Department"
                                    },
                                    "is_active": {
                                        "type": "boolean",
                                        "example": true
                                    },
                                    "manager_id": {
                                        "description": "Must be an employee who belongs to THIS department and is not already the manager of another department. Setting it promotes that employee's account to Department Manager; the previous manager (if different) is automatically demoted back to Employee (unless they still manage another department).",
                                        "type": "string",
                                        "format": "uuid",
                                        "nullable": true
                                    }
                                },
                                "type": "object"
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "تم التعديل"
                    },
                    "404": {
                        "description": "Not found / not in your company"
                    },
                    "422": {
                        "description": "Validation failed (including manager_id not belonging to this department, or already managing a different department)"
                    },
                    "403": {
                        "description": "Company is frozen (status=suspended)"
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            },
            "delete": {
                "tags": [
                    "Departments"
                ],
                "summary": "حذف قسم (يُمنع الحذف إذا يحتوي موظفين)",
                "operationId": "96d6c33e67a7e240a858e3aca91736cb",
                "parameters": [
                    {
                        "name": "department",
                        "in": "path",
                        "required": true,
                        "schema": {
                            "type": "string",
                            "format": "uuid"
                        }
                    }
                ],
                "responses": {
                    "200": {
                        "description": "تم الحذف"
                    },
                    "404": {
                        "description": "Not found / not in your company"
                    },
                    "409": {
                        "description": "Cannot delete: department has employees"
                    }
                },
                "security": [
                    {
                        "sanctum": []
                    }
                ]
            }
        },

