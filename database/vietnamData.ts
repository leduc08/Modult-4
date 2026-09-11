import { Province, TravelTip, Festival, Souvenir, FoodSpot, POI } from './types';

export const ALL_TIPS: TravelTip[] = [
  // Safety & Emergency
  {
    id: 'tip-safe-1',
    title: 'Hotline Cứu hộ Du lịch khẩn cấp toàn quốc',
    category: 'safety',
    content: 'Lưu ngay các đầu số: 112 (Cứu nạn cứu hộ thiên tai), 113 (Công an), 114 (Cứu hỏa), 115 (Cấp cứu). Hotline hỗ trợ du khách Hà Nội: 1800556896 | Đà Nẵng: 0236.3550111 | TP.HCM: 1022 nhánh 8.',
    importance: 'Khẩn cấp',
    tags: ['hotline', 'an toàn', 'toàn quốc']
  },
  {
    id: 'tip-safe-2',
    title: 'Bí quyết chống say xe trên cung đèo Tây Bắc & Hà Giang',
    category: 'safety',
    content: 'Uống thuốc chống say (Dimenhydrinate hoặc Nautamine) trước khi xe lăn bánh 30 phút. Tránh nhìn điện thoại, ngồi ghế đầu/giữa, ngậm gừng tươi hoặc vỏ quýt ép tinh dầu.',
    importance: 'Cao',
    tags: ['hà giang', 'tây bắc', 'sức khỏe']
  },
  {
    id: 'tip-safe-3',
    title: 'Tránh bẫy taxi dù tại sân bay Nội Bài và Tân Sơn Nhất',
    category: 'safety',
    content: 'Chỉ đón xe tại làn đón có điều phối viên của Mai Linh (1055), Vinasun, hoặc đặt trực tiếp qua Grab/Be/Xanh SM. Không bao giờ đi theo người mồi chài "Đi xe ôm/taxi giá rẻ anh ơi" tại cửa ga đến.',
    importance: 'Cao',
    tags: ['sân bay', 'di chuyển', 'taxi']
  },
  {
    id: 'tip-safe-4',
    title: 'Quy tắc an toàn khi tắm biển miền Trung (Hội An, Mỹ Khê, Nha Trang)',
    category: 'safety',
    content: 'Luôn quan sát cờ cảnh báo (Cờ đỏ: Cấm tắm; Cờ vàng: Thận trọng). Chú ý dòng nước xoáy xa bờ (Rip Current) - có vùng nước phẳng lặng giữa những con sóng vỗ. Nếu rơi vào dòng xoáy, bơi ngang song song bờ biển, không bơi ngược dòng.',
    importance: 'Cao',
    tags: ['biển', 'đà nẵng', 'nha trang']
  },

  // Finance & Bargaining
  {
    id: 'tip-fin-1',
    title: 'Kỹ thuật thương lượng giá tại các chợ đêm Việt Nam',
    category: 'finance',
    content: 'Tại chợ đêm Phố Cổ (HN), Bến Thành (HCM) hay Chợ Đêm Đà Lạt: Với quần áo/quà lưu niệm, hãy trả giá từ 60-70% giá báo đầu tiên. Đi chợ vào buổi tối đông đúc sẽ dễ thương lượng hơn là buổi sáng sớm (tránh giờ mở hàng vì tiểu thương kiêng kỵ phong long).',
    importance: 'Cao',
    tags: ['mua sắm', 'trả giá', 'chợ đêm']
  },
  {
    id: 'tip-fin-2',
    title: 'Tránh phụ thu khi ăn hải sản tươi sống ở các thành phố biển',
    category: 'finance',
    content: 'Luôn yêu cầu cân hải sản tại bể sống trước mặt bạn và hỏi rõ: "Giá này đã bao gồm công chế biến chưa?". Yêu cầu vẩy ráo nước khỏi rổ cân trước khi đặt lên bàn cân.',
    importance: 'Cao',
    tags: ['ẩm thực', 'hải sản', 'chi phí']
  },
  {
    id: 'tip-fin-3',
    title: 'Kinh nghiệm thuê xe máy tự lái an toàn & không mất cọc',
    category: 'finance',
    content: 'Giá chuẩn: 100k - 150k/ngày (xe số), 150k - 200k/ngày (xe ga), 250k - 350k (xe cào cào/côn tay phượt đèo). Chụp ảnh & quay video 360 độ các vết xước cũ, lốp, phanh trước khi nhận xe. Yêu cầu 2 mũ bảo hiểm đạt chuẩn có kính chắn gió.',
    importance: 'Cao',
    tags: ['thuê xe', 'tiết kiệm', 'phượt']
  },

  // Food & Culinary
  {
    id: 'tip-food-1',
    title: 'Cách nhận biết quán phở & bún gia truyền chuẩn vị Hà Nội',
    category: 'food',
    content: 'Quán bản địa thường không có bảng hiệu quá hào nhoáng. Hãy quan sát nồi nước dùng: sôi lăn tăn, thơm nồng thảo quả, quế, hoa hồi, xương ống hầm trong veo, quán đông khách địa phương từ 6h30 sáng.',
    importance: 'Trung bình',
    tags: ['hà nội', 'ẩm thực', 'phở']
  },
  {
    id: 'tip-food-2',
    title: 'Quy tắc ăn bánh xèo miền Trung vs bánh xèo miền Tây',
    category: 'food',
    content: 'Bánh xèo miền Trung (nhỏ, vỏ giòn dày, cuốn bánh tráng nhúng nước kèm ram bắp và chấm sốt tương đậu phộng). Bánh xèo miền Tây (khổng lồ, giòn mỏng viền, nhân đậu xanh thịt ba rọi tép sông, cuốn lá cách, đọt xoài và chấm mắm chua ngọt).',
    importance: 'Trung bình',
    tags: ['văn hóa', 'ẩm thực', 'bánh xèo']
  },
  {
    id: 'tip-food-3',
    title: 'Cảnh báo về ăn ấu tẩu & thắng cố ở Hà Giang',
    category: 'food',
    content: 'Cháo ấu tẩu chỉ nên ăn vào buổi tối để ngủ ngon và thư giãn cơ bắp sau ngày dài leo đèo. Tuyệt đối không ăn kèm quả lê hoặc uống nước lê sau khi ăn cháo ấu tẩu vì kỵ tính theo y học cổ truyền.',
    importance: 'Cao',
    tags: ['hà giang', 'mẹo ăn uống', 'đặc sản']
  },

  // Timing
  {
    id: 'tip-time-1',
    title: 'Khung giờ vàng săn mây Tà Xùa & Đà Lạt',
    category: 'timing',
    content: 'Thời điểm lý tưởng: 5h00 - 6h30 sáng. Điều kiện tiên quyết: Ngày hôm trước có mưa phùn/độ ẩm cao (>80%), sáng hôm sau trời hửng nắng nhẹ, lặng gió. Hãy kiểm tra camera trực tiếp hoặc hỏi chủ homestay từ 4h30 sáng.',
    importance: 'Cao',
    tags: ['săn mây', 'đà lạt', 'tà xùa']
  },
  {
    id: 'tip-time-2',
    title: 'Mùa nước nổi Miền Tây (Tháng 9 - 11)',
    category: 'timing',
    content: 'Thời điểm đẹp nhất để trải nghiệm rừng tràm Trà Sư bèo cám xanh mướt, chợ nổi Cái Răng tấp nập thuyền hoa trái, và thưởng thức cá linh non kho mía cùng lẩu hoa điên điển giòn ngọt.',
    importance: 'Trung bình',
    tags: ['miền tây', 'mùa vụ', 'cần thơ']
  },

  // Culture & Taboos
  {
    id: 'tip-cul-1',
    title: 'Trang phục và phong tục khi tham quan đền chùa & di tích tâm linh',
    category: 'culture',
    content: 'Mặc áo có tay, quần hoặc váy dài qua đầu gối. Khi vào chính điện, bước qua bậu cửa (không dẫm chân lên bậu cửa gỗ). Nói khẽ, đi nhẹ và không chỉ tay trực diện vào tượng Phật/Thần thánh.',
    importance: 'Cao',
    tags: ['tâm linh', 'văn hóa', 'chùa']
  },
  {
    id: 'tip-cul-2',
    title: 'Phong tục cắm đũa kiêng kỵ trong bữa ăn người Việt',
    category: 'culture',
    content: 'Tuyệt đối không cắm thẳng đứng đôi đũa vào giữa bát cơm vì hình ảnh này gợi liên tưởng đến bát hương cúng người đã khuất. Luôn đặt đũa ngang trên miệng bát hoặc gác đũa.',
    importance: 'Cao',
    tags: ['văn hóa', 'ẩm thực', 'kiêng kỵ']
  }
];

export const PROVINCES: Province[] = [
  {
    id: 'ha-noi',
    name: 'Hà Nội',
    region: 'Bắc',
    coordinates: { lat: 21.0285, lng: 105.8542 },
    tagline: 'Thủ đô nghìn năm văn hiến — Trái tim của văn hóa & ẩm thực Bắc Bộ',
    description: 'Hà Nội quyến rũ du khách bởi nét cổ kính của 36 phố phường, mặt hồ Gươm phẳng lặng, hàng cây hoa sữa nồng nàn và nền ẩm thực tinh tế bậc nhất phương Đông.',
    bestMonths: 'Tháng 9 - 11 (Mùa thu đẹp ngỡ ngàng) & Tháng 1 - 3 (Mùa xuân hoa đào)',
    weatherSummary: 'Khí hậu nhiệt đới gió mùa: Mùa đông se lạnh (12-18°C), Mùa thu mát mẻ trong lành (22-28°C).',
    cultureHistory: 'Thành lập từ năm 1010 thời Vua Lý Thái Tổ dời đô về Thăng Long. Là trung tâm lưu giữ di sản Phật giáo, Nho giáo và kiến trúc Pháp cổ giao thoa.',
    culturalTaboos: [
      'Tránh trả giá vào sáng sớm tại các quầy chợ truyền thống khi chủ quán chưa bán mở hàng.',
      'Không mặc quần áo hở hang khi viếng Lăng Bác, Chùa Một Cột, Đền Ngọc Sơn.',
      'Không dùng ngón tay trỏ chỉ thẳng vào di vật bảo vật quốc gia trong bảo tàng.'
    ],
    transportation: {
      arrival: ['Sân bay Quốc tế Nội Bài (cách trung tâm 28km, xe buýt 86 giá 45k/lượt)', 'Ga Hà Nội (trung tâm Đống Đa)'],
      localMove: ['Xe buýt 2 tầng City Sightseeing', 'Xe buýt điện VinBus', 'Xích lô phố cổ (100k-150k/giờ)', 'Thuê xe máy'],
      avgBikeRental: '100.000 - 150.000đ/ngày',
      avgTaxiRate: '12.000 - 15.000đ/km'
    },
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=900&auto=format&fit=crop&q=80',
    pois: [
      {
        id: 'hn-poi-1',
        name: 'Hồ Hoàn Kiếm & Đền Ngọc Sơn',
        category: 'Di sản & Văn hóa',
        coordinates: { lat: 21.0307, lng: 105.8524 },
        address: 'Đinh Tiên Hoàng, Hàng Trống, Hoàn Kiếm, Hà Nội',
        openingHours: '07:00 - 18:00 (Cầu Thê Húc mở cả ngày)',
        ticketPrice: 30000,
        estimatedTime: '1.5 - 2 giờ',
        description: 'Biểu tượng lịch sử gắn liền truyền thuyết Vua Lê Lợi trả gươm báu cho Rùa Vàng. Đi qua Cầu Thê Húc đỏ son vào Đền Ngọc Sơn tĩnh mịch giữa lòng hồ.',
        imageUrl: 'https://images.unsplash.com/photo-1599818817342-a8c6b245785a?w=700&auto=format&fit=crop&q=80',
        tags: ['biểu tượng', 'lịch sử', 'check-in', 'hồ gươm'],
        localTips: 'Đi dạo vào tối thứ 6 đến chủ nhật khi toàn bộ khu vực quanh hồ chuyển thành Phố đi bộ với nhiều nghệ sĩ đường phố.',
        rating: 4.8,
        reviewCount: 3240
      },
      {
        id: 'hn-poi-2',
        name: 'Văn Miếu - Quốc Tử Giám',
        category: 'Di sản & Văn hóa',
        coordinates: { lat: 21.0276, lng: 105.8355 },
        address: '58 Quốc Tử Giám, Văn Miếu, Đống Đa, Hà Nội',
        openingHours: '08:00 - 17:00',
        ticketPrice: 70000,
        estimatedTime: '2 giờ',
        description: 'Trường đại học đầu tiên của Việt Nam xây dựng năm 1070. Lưu giữ 82 bia tiến sĩ bằng đá nghìn năm tuổi vinh danh nhân tài đất nước.',
        imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=700&auto=format&fit=crop&q=80',
        tags: ['di sản thế giới', 'học thức', 'kiến trúc cổ'],
        localTips: 'Có tour đêm Văn Miếu với công nghệ trình chiếu 3D Mapping rất mãn nhãn vào thứ 4, thứ 7 và chủ nhật.',
        rating: 4.9,
        reviewCount: 2890
      },
      {
        id: 'hn-poi-3',
        name: 'Phố Cổ Hà Nội (36 Phố Phường)',
        category: 'Check-in',
        coordinates: { lat: 21.0345, lng: 105.8502 },
        address: 'Khu vực Hoàn Kiếm, Hà Nội',
        openingHours: 'Cả ngày (Nhộn nhịp từ 16:00 - 23:00)',
        ticketPrice: 0,
        estimatedTime: '3 - 4 giờ',
        description: 'Mê cung các con phố mang tên hàng thủ công từ thế kỷ 15: Hàng Bạc, Hàng Mã, Hàng Đào, Tạ Hiện náo nhiệt bia tươi.',
        imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=700&auto=format&fit=crop&q=80',
        tags: ['phố cổ', 'nightlife', 'ẩm thực', 'tạ hiện'],
        localTips: 'Thưởng thức bia hơi Tạ Hiện vào buổi tối hoặc ghé phố cà phê đường tàu (chỉ vào các quán có đăng ký an toàn).',
        rating: 4.7,
        reviewCount: 4120
      }
    ],
    foods: [
      {
        id: 'hn-food-1',
        name: 'Phở Gia Truyền Bát Đàn',
        dishName: 'Phở bò tái lăn / chín',
        category: 'Món chính',
        address: '49 Bát Đàn, Cửa Đông, Hoàn Kiếm, Hà Nội',
        coordinates: { lat: 21.0342, lng: 105.8475 },
        priceRange: '55.000 - 75.000đ',
        avgPrice: 65000,
        bestTime: '06:30 - 08:30 sáng hoặc 18:30 tối',
        isMustTry: true,
        isSeasonal: false,
        isLocalFavorite: true,
        description: 'Quán phở xếp hàng nổi tiếng nhất Hà Nội với nước dùng bò hầm nguyên chất trong vắt, thịt bò xào tái lăn thơm mùi tỏi gừng quyến rũ.',
        imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80',
        rating: 4.8,
        reviewCount: 1560,
        signatureDish: 'Phở bò tái gầu giòn giòn nước béo'
      },
      {
        id: 'hn-food-2',
        name: 'Bún Chả Đắc Kim',
        dishName: 'Bún chả Hà Nội',
        category: 'Món chính',
        address: 'Số 1 Hàng Mành, Hàng Gai, Hoàn Kiếm, Hà Nội',
        coordinates: { lat: 21.0328, lng: 105.8488 },
        priceRange: '60.000 - 80.000đ',
        avgPrice: 70000,
        bestTime: '11:00 - 13:30 trưa',
        isMustTry: true,
        isSeasonal: false,
        isLocalFavorite: true,
        description: 'Chả băm và chả miếng nướng than hoa vàng óng, ngập trong bát nước mắm chua ngọt ấm nóng kèm đu đủ giòn và đĩa nem cua bể giòn rụm.',
        imageUrl: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=600&auto=format&fit=crop&q=80',
        rating: 4.6,
        reviewCount: 2100,
        signatureDish: 'Bún chả nem cua bể đặc biệt'
      },
      {
        id: 'hn-food-3',
        name: 'Cafe Giảng',
        dishName: 'Cà phê trứng Hà Nội',
        category: 'Cà phê & Đồ uống',
        address: '39 Nguyễn Hữu Huân, Lý Thái Tổ, Hoàn Kiếm, Hà Nội',
        coordinates: { lat: 21.0336, lng: 105.8546 },
        priceRange: '35.000 - 45.000đ',
        avgPrice: 40000,
        bestTime: '08:00 - 10:00 sáng hoặc 15:00 chiều',
        isMustTry: true,
        isSeasonal: false,
        isLocalFavorite: true,
        description: 'Nơi khai sinh món cà phê trứng trứ danh từ năm 1946 do cụ Nguyễn Văn Giảng sáng tạo. Lớp kem trứng đánh bông mịn ngậy béo hòa quyện cà phê Robusta đậm đà.',
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
        rating: 4.9,
        reviewCount: 3890,
        signatureDish: 'Cà phê trứng nóng / Cacao trứng'
      }
    ],
    festivals: [
      {
        id: 'hn-fest-1',
        name: 'Lễ hội Đền Cổ Loa',
        provinceId: 'ha-noi',
        provinceName: 'Hà Nội',
        solarDate: '15/02 dương lịch hàng năm',
        lunarDate: 'Mùng 6 tháng Giêng âm lịch',
        scale: 'Tỉnh',
        description: 'Tưởng nhớ Vua An Dương Vương có công dựng nước Âu Lạc và xây thành Cổ Loa hình xoáy ốc huyền thoại.',
        highlights: ['Rước kiệu Bát Xã Cổ Loa', 'Bắn nỏ thần tượng trưng', 'Đấu vật truyền thống', 'Hát tuồng cổ'],
        dressCode: 'Lịch sự, kín đáo, đi giày bệt dễ di chuyển',
        etiquette: 'Không dẫm chân lên chiếu rước thánh, giữ trật tự khi tế lễ',
        ticketPrice: 20000,
        imageUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=600&auto=format&fit=crop&q=80'
      }
    ],
    souvenirs: [
      {
        id: 'hn-souv-1',
        name: 'Cốm Làng Vòng & Bánh Cốm Hàng Than',
        provinceId: 'ha-noi',
        provinceName: 'Hà Nội',
        standardPrice: '60.000 - 120.000đ/hộp',
        shelfLife: '3 - 5 ngày (Cốm tươi) | 10 ngày (Bánh cốm)',
        isOCOP: true,
        ocopStars: 5,
        flightRule: 'Được xách tay',
        flightNote: 'Được phép mang lên cabin máy bay thoải mái dưới dạng thực phẩm khô.',
        trustedAddresses: ['Bánh cốm Nguyên Ninh - 11 Hàng Than', 'Cốm Làng Vòng bà Hoản - Dịch Vọng Hậu'],
        imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'hn-souv-2',
        name: 'Trà Sen Tây Hồ Thượng Hạng',
        provinceId: 'ha-noi',
        provinceName: 'Hà Nội',
        standardPrice: '400.000 - 800.000đ/100g',
        shelfLife: '12 tháng (Hút chân không)',
        isOCOP: true,
        ocopStars: 5,
        flightRule: 'Được xách tay',
        flightNote: 'Hút chân không mang xách tay hoặc gửi hành lý quốc tế an toàn.',
        trustedAddresses: ['Trà sen Quảng An - Tây Hồ', 'Hiệu chè Ninh Hương - 22 Hàng Điếu'],
        imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80'
      }
    ],
    tips: [
      {
        id: 'hn-tip-1',
        title: 'Mẹo đi phố đi bộ Hồ Gươm và ăn vặt phố cổ không lo chặt chém',
        category: 'food',
        content: 'Khi ngồi các quán cóc hè phố Hàng Bông/Hàng Bồ, luôn hỏi giá đĩa ốc luộc/nem chua rán trước khi gọi (tránh bị hét giá gấp đôi vào đêm muộn).',
        importance: 'Cao',
        tags: ['hà nội', 'ẩm thực', 'giá cả']
      }
    ]
  },

  {
    id: 'da-nang',
    name: 'Đà Nẵng',
    region: 'Trung',
    coordinates: { lat: 16.0544, lng: 108.2022 },
    tagline: 'Thành phố đáng sống nhất Việt Nam — Cầu Rồng, Biển Mỹ Khê & Bán đảo Sơn Trà',
    description: 'Đô thị biển hiện đại, văn minh và mến khách. Cửa ngõ kết nối 3 Di sản Văn hóa Thế giới: Cố đô Huế, Phố cổ Hội An và Thánh địa Mỹ Sơn.',
    bestMonths: 'Tháng 3 - 8 (Nắng vàng biển xanh sóng êm) & Mùa Lễ hội Pháo hoa DIFF (Tháng 6-7)',
    weatherSummary: 'Nhiệt độ trung bình 28-34°C, nắng đẹp, gió biển mát rượi.',
    cultureHistory: 'Vùng đất giao thoa văn hóa Champa cổ kính với văn hóa Việt truyền thống, trung tâm kinh tế năng động nhất miền Trung.',
    culturalTaboos: [
      'Không xả rác trên bãi biển Mỹ Khê (phạt nặng theo quy định đô thị văn minh).',
      'Không cho khỉ ăn thức ăn vặt bừa bãi tại Bán đảo Sơn Trà.',
      'Ăn mặc trang nghiêm khi viếng Chùa Linh Ứng Bãi Bụt.'
    ],
    transportation: {
      arrival: ['Sân bay Quốc tế Đà Nẵng (nằm ngay trong trung tâm thành phố, đi taxi chỉ 10 phút đến biển)', 'Ga Đà Nẵng'],
      localMove: ['Thuê xe máy', 'Taxi Grab/Xanh SM', 'Xe buýt liên tỉnh Đà Nẵng - Hội An'],
      avgBikeRental: '120.000 - 150.000đ/ngày',
      avgTaxiRate: '13.000 - 16.000đ/km'
    },
    imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=900&auto=format&fit=crop&q=80',
    pois: [
      {
        id: 'dn-poi-1',
        name: 'Cầu Rồng & Cầu Tình Yêu',
        category: 'Check-in',
        coordinates: { lat: 16.0611, lng: 108.2272 },
        address: 'Đường Nguyễn Văn Linh / Trần Hưng Đạo, Sơn Trà, Đà Nẵng',
        openingHours: 'Cả ngày (Phun lửa lúc 21:00 Thứ 7 & Chủ Nhật)',
        ticketPrice: 0,
        estimatedTime: '1.5 giờ',
        description: 'Cây cầu thép hình rồng độc nhất vô nhị bắc qua Sông Hàn. Cuối tuần rồng phun lửa và phun nước tạo nên màn trình diễn ngoạn mục thu hút hàng ngàn du khách.',
        imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=700&auto=format&fit=crop&q=80',
        tags: ['cầu rồng', 'sông hàn', 'phun lửa', 'check-in'],
        localTips: 'Đứng phía đầu cầu bờ Đông (đường Trần Hưng Đạo) để xem phun lửa đẹp nhất, tránh đứng xuôi chiều gió vì có thể bị nước phun ướt áo.',
        rating: 4.9,
        reviewCount: 5120
      },
      {
        id: 'dn-poi-2',
        name: 'Bà Nà Hills & Cầu Vàng (Golden Bridge)',
        category: 'Giải trí',
        coordinates: { lat: 15.9954, lng: 107.9965 },
        address: 'Hòa Phú, Hòa Vang, Đà Nẵng',
        openingHours: '07:30 - 21:00',
        ticketPrice: 900000,
        estimatedTime: '5 - 7 giờ',
        description: 'Kỳ quan Cầu Vàng nâng đỡ bởi đôi bàn tay đá khổng lồ vươn giữa mây trời, làng Pháp cổ tích và hệ thống cáp treo đạt kỷ lục Guinness.',
        imageUrl: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=700&auto=format&fit=crop&q=80',
        tags: ['cầu vàng', 'cáp treo', 'bà nà', 'kỳ quan'],
        localTips: 'Lên chuyến cáp treo sớm nhất lúc 7h30 sáng để chụp ảnh Cầu Vàng khi chưa đông khách hoặc mua combo vé chiều tối săn hoàng hôn.',
        rating: 4.9,
        reviewCount: 6890
      },
      {
        id: 'dn-poi-3',
        name: 'Bán Đảo Sơn Trà & Chùa Linh Ứng Bãi Bụt',
        category: 'Tâm linh',
        coordinates: { lat: 16.1039, lng: 108.2778 },
        address: 'Bãi Bụt, Bán đảo Sơn Trà, Đà Nẵng',
        openingHours: '06:00 - 18:00',
        ticketPrice: 0,
        estimatedTime: '2.5 giờ',
        description: 'Tượng Phật Bà Quan Thế Âm cao 67m ngắm trọn toàn cảnh vịnh biển Đà Nẵng. Lá phổi xanh lưu giữ loài Voọc chà vá chân nâu quý hiếm.',
        imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=700&auto=format&fit=crop&q=80',
        tags: ['chùa linh ứng', 'bán đảo sơn trà', 'tâm linh', 'view biển'],
        localTips: 'Đi xe số hoặc xe côn (cấm xe tay ga lên một số đoạn dốc cao Sơn Trà theo quy định an toàn giao thông).',
        rating: 4.8,
        reviewCount: 3840
      }
    ],
    foods: [
      {
        id: 'dn-food-1',
        name: 'Mì Quảng Bà Mua',
        dishName: 'Mì Quảng tôm thịt / ếch',
        category: 'Món chính',
        address: '19 Trần Bình Trọng, Hải Châu, Đà Nẵng',
        coordinates: { lat: 16.0645, lng: 108.2185 },
        priceRange: '35.000 - 55.000đ',
        avgPrice: 45000,
        bestTime: '07:00 - 21:00',
        isMustTry: true,
        isSeasonal: false,
        isLocalFavorite: true,
        description: 'Sợi mì gạo mềm mượt hòa quyện nước nhưỡng đậm đà vừa xăm xắp, đậu phộng rang thơm lừng, bánh tráng nướng giòn rụm và đĩa rau sống bắp chuối tươi mát.',
        imageUrl: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=600&auto=format&fit=crop&q=80',
        rating: 4.8,
        reviewCount: 2310,
        signatureDish: 'Mì Quảng đặc biệt thập cẩm tôm thịt trứng'
      },
      {
        id: 'dn-food-2',
        name: 'Bánh Tráng Cuốn Thịt Heo Đại Lộc',
        dishName: 'Bánh tráng cuốn thịt hai đầu da',
        category: 'Món chính',
        address: '97 Trưng Nữ Vương, Hải Châu, Đà Nẵng',
        coordinates: { lat: 16.0592, lng: 108.2201 },
        priceRange: '45.000 - 70.000đ',
        avgPrice: 55000,
        bestTime: '11:00 - 14:00 hoặc 17:00 - 21:00',
        isMustTry: true,
        isSeasonal: false,
        isLocalFavorite: true,
        description: 'Thịt heo luộc khéo léo lấy trọn hai đầu mỡ bì giòn, cuốn cùng bánh tráng phơi sương Đại Lộc, dưa leo, chuối chát và chấm mắm nêm đậm đà thơm cay.',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
        rating: 4.7,
        reviewCount: 1980,
        signatureDish: 'Thịt heo hai đầu da chấm mắm nêm'
      }
    ],
    festivals: [
      {
        id: 'dn-fest-1',
        name: 'Lễ hội Pháo hoa Quốc tế Đà Nẵng (DIFF)',
        provinceId: 'da-nang',
        provinceName: 'Đà Nẵng',
        solarDate: 'Tháng 6 - Tháng 7 hàng năm',
        lunarDate: 'Tổ chức theo lịch mùa hè',
        scale: 'Quốc gia',
        description: 'Đại tiệc ánh sáng và âm nhạc quy mô toàn cầu bên bờ sông Hàn với sự tranh tài của 8 đội tuyển pháo hoa hàng đầu thế giới.',
        highlights: ['Trình diễn pháo hoa nghệ thuật trên mặt nước', 'Lễ hội âm nhạc đường phố', 'Ẩm thực quốc tế'],
        dressCode: 'Thoải mái, mát mẻ, chống muỗi',
        etiquette: 'Nên đặt vé khán đài hoặc du thuyền trước 1-2 tháng để có chỗ ngồi đẹp',
        ticketPrice: 800000,
        imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&auto=format&fit=crop&q=80'
      }
    ],
    souvenirs: [
      {
        id: 'dn-souv-1',
        name: 'Chả Bò Đà Nẵng Loại 1',
        provinceId: 'da-nang',
        provinceName: 'Đà Nẵng',
        standardPrice: '320.000 - 380.000đ/kg',
        shelfLife: '2 ngày (Nhiệt độ phòng) | 1 tháng (Ngăn đông)',
        isOCOP: true,
        ocopStars: 4,
        flightRule: 'Được xách tay',
        flightNote: 'Hàng khô đóng gói lá chuối được xách tay lên máy bay nội địa thoải mái.',
        trustedAddresses: ['Chả bò Cô Huệ - 230 Tôn Đức Thắng', 'Chả bò Lộc - 4 Trần Bình Trọng'],
        imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80'
      }
    ],
    tips: [
      {
        id: 'dn-tip-1',
        title: 'Mẹo ngắm trọn vẹn Cầu Rồng phun lửa không lo kẹt xe',
        category: 'timing',
        content: 'Hãy có mặt tại khu vực đường Trần Hưng Đạo hoặc đặt bàn tại các quán cafe tầng thượng view sông Hàn từ 20h15. Sau khi rồng phun xong, đợi 15 phút hẵng lấy xe để tránh ùn ứ.',
        importance: 'Cao',
        tags: ['cầu rồng', 'kinh nghiệm', 'đà nẵng']
      }
    ]
  },

  {
    id: 'quang-nam',
    name: 'Quảng Nam (Hội An)',
    region: 'Trung',
    coordinates: { lat: 15.8801, lng: 108.338 },
    tagline: 'Phố Cổ Hội An — Di sản lung linh đèn lồng bên dòng sông Hoài thơ mộng',
    description: 'Thương cảng quốc tế sầm uất từ thế kỷ 16-17, nơi hòa quyện hoàn hảo giữa kiến trúc truyền thống Việt Nam, nhà rường gỗ Nhật Bản và phong cách hoa lệ Trung Hoa.',
    bestMonths: 'Tháng 2 - 8 (Thời tiết khô ráo, nắng dịu, lý tưởng chụp ảnh)',
    weatherSummary: 'Nắng ấm chan hòa, buổi tối mát lành gió sông Hoài.',
    cultureHistory: 'Di sản Văn hóa Thế giới UNESCO công nhận từ 1999. Nổi tiếng với đêm rằm phố cổ tắt đèn điện thả hoa đăng lung linh.',
    culturalTaboos: [
      'Không thả hoa đăng bằng nhựa hoặc đế xốp (chỉ dùng hoa đăng giấy bảo vệ môi trường dòng sông).',
      'Không chen lấn, giữ trật tự khi đi qua Chùa Cầu gỗ cổ kính.'
    ],
    transportation: {
      arrival: ['Từ sân bay Đà Nẵng đi xe buýt/taxi về Hội An khoảng 30km (45 phút)'],
      localMove: ['Xe đạp dạo phố (hầu hết homestay miễn phí)', 'Đi bộ trong phố cổ', 'Thuyền chèo sông Hoài'],
      avgBikeRental: '40.000 - 50.000đ/ngày (Xe đạp) | 120.000đ (Xe máy)',
      avgTaxiRate: '13.000đ/km'
    },
    imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=900&auto=format&fit=crop&q=80',
    pois: [
      {
        id: 'ha-poi-1',
        name: 'Chùa Cầu (Lai Viễn Kiều)',
        category: 'Di sản & Văn hóa',
        coordinates: { lat: 15.8771, lng: 108.326 },
        address: 'Nguyễn Thị Minh Khai, Phường Minh An, Hội An',
        openingHours: 'Cả ngày',
        ticketPrice: 80000,
        estimatedTime: '1 giờ',
        description: 'Biểu tượng lịch sử trên tờ tiền polymer 20.000 VNĐ. Cây cầu gỗ mái ngói âm dương do các thương nhân Nhật Bản xây dựng đầu thế kỷ 17.',
        imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=700&auto=format&fit=crop&q=80',
        tags: ['chùa cầu', 'di sản unesco', 'biểu tượng', 'hội an'],
        localTips: 'Vé tham quan phố cổ 80k cho phép bạn vào 4 điểm di tích bất kỳ (Nhà cổ Tấn Ký, Hội quán Phúc Kiến, v.v.).',
        rating: 4.8,
        reviewCount: 4320
      },
      {
        id: 'ha-poi-2',
        name: 'Show Diễn Thực Cảnh "Ký Ức Hội An"',
        category: 'Giải trí',
        coordinates: { lat: 15.8722, lng: 108.3412 },
        address: 'Cồn Hến, Cẩm An, Hội An',
        openingHours: '20:00 - 21:00 (Hàng đêm trừ thứ 3)',
        ticketPrice: 600000,
        estimatedTime: '2.5 giờ',
        description: 'Show diễn ngoài trời hoành tráng nhất Việt Nam với hơn 500 diễn viên trên sân khấu nổi 25.000m², tái hiện 400 năm thăng trầm của thương cảng Faifo.',
        imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=700&auto=format&fit=crop&q=80',
        tags: ['show diễn', 'ký ức hội an', 'nghệ thuật', 'thực cảnh'],
        localTips: 'Nên đặt vé hạng High (hàng ghế trên cao) để bao quát toàn cảnh hiệu ứng ánh sáng và đoàn thuyền ánh sáng.',
        rating: 4.9,
        reviewCount: 3120
      }
    ],
    foods: [
      {
        id: 'ha-food-1',
        name: 'Cao Lầu Thanh Hội An',
        dishName: 'Cao lầu truyền thống',
        category: 'Món chính',
        address: '26 Thái Phiên, Phường Minh An, Hội An',
        coordinates: { lat: 15.8795, lng: 108.3298 },
        priceRange: '35.000 - 45.000đ',
        avgPrice: 40000,
        bestTime: '07:00 - 19:00',
        isMustTry: true,
        isSeasonal: false,
        isLocalFavorite: true,
        description: 'Sợi cao lầu giòn dai đặc trưng ngâm tro củi Cù Lao Chàm và nước giếng Bá Lễ nghìn năm, ăn kèm thịt xá xíu đậm đà, tóp mỡ chiên giòn rụm và rau thơm Trà Quế.',
        imageUrl: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=600&auto=format&fit=crop&q=80',
        rating: 4.9,
        reviewCount: 1890,
        signatureDish: 'Cao lầu xá xíu tóp mỡ giòn'
      },
      {
        id: 'ha-food-2',
        name: 'Bánh Mì Phượng',
        dishName: 'Bánh mì kẹp thập cẩm',
        category: 'Ăn vặt & Đường phố',
        address: '2B Phan Chu Trinh, Cẩm Châu, Hội An',
        coordinates: { lat: 15.8791, lng: 108.3325 },
        priceRange: '30.000 - 40.000đ',
        avgPrice: 35000,
        bestTime: '07:00 - 21:00',
        isMustTry: true,
        isSeasonal: false,
        isLocalFavorite: false,
        description: 'Bánh mì nổi tiếng thế giới từng được cố đầu bếp Anthony Bourdain ca ngợi là "bản giao hưởng bánh mì đỉnh cao". Vỏ bánh giòn tan ngập pate, bơ béo và sốt thịt bí truyền.',
        imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80',
        rating: 4.6,
        reviewCount: 4500,
        signatureDish: 'Bánh mì thập cẩm đặc biệt'
      }
    ],
    festivals: [
      {
        id: 'ha-fest-1',
        name: 'Đêm Phố Cổ Hội An (Đêm Rằm Hoa Đăng)',
        provinceId: 'quang-nam',
        provinceName: 'Quảng Nam',
        solarDate: 'Hàng tháng theo lịch âm',
        lunarDate: 'Tối ngày 14 âm lịch hàng tháng',
        scale: 'Tỉnh',
        description: 'Cả khu phố cổ đồng loạt tắt đèn điện, thắp sáng bằng hàng ngàn lồng đèn lụa và người dân cùng nhau thả hoa đăng cầu may trên sông Hoài.',
        highlights: ['Thả hoa đăng sông Hoài', 'Hát bài chòi dân gian', 'Trò chơi bịt mắt đập niêu'],
        dressCode: 'Áo dài truyền thống hoặc đồ sáng màu',
        etiquette: 'Mua hoa đăng từ các cô chú chèo đò truyền thống (5k-10k/chiếc)',
        ticketPrice: 0,
        imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80'
      }
    ],
    souvenirs: [
      {
        id: 'ha-souv-1',
        name: 'Đèn Lồng Lụa Hội An Thủ Công',
        provinceId: 'quang-nam',
        provinceName: 'Quảng Nam',
        standardPrice: '50.000 - 180.000đ/chiếc (tùy kích cỡ)',
        shelfLife: 'Lâu dài',
        isOCOP: true,
        ocopStars: 4,
        flightRule: 'Được xách tay',
        flightNote: 'Có thể gập gọn lại thành hình ống tròn, xách tay lên máy bay rất tiện lợi.',
        trustedAddresses: ['Xưởng lồng đèn Huỳnh Văn Ba - 54 Nguyễn Thị Minh Khai', 'Lồng đèn Hà Linh'],
        imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&auto=format&fit=crop&q=80'
      }
    ],
    tips: [
      {
        id: 'ha-tip-1',
        title: 'Mẹo may đo quần áo lấy ngay trong 24h ở Hội An',
        category: 'culture',
        content: 'Hội An là thủ phủ may đo nhanh (suit, váy lụa, áo dài). Bạn chỉ cần chọn mẫu trên Pinterest hoặc mang áo mẫu, thợ may sẽ đo và hoàn thành sau 6 - 24 giờ với chất liệu lụa tơ tằm thượng hạng.',
        importance: 'Cao',
        tags: ['may đo', 'mua sắm', 'hội an']
      }
    ]
  },

  {
    id: 'lam-dong',
    name: 'Lâm Đồng (Đà Lạt)',
    region: 'Tây Nguyên',
    coordinates: { lat: 11.9404, lng: 108.4583 },
    tagline: 'Thành phố sương mù — Xứ sở ngàn hoa, đồi thông reo & cà phê Arabica',
    description: 'Cao nguyên Lâm Viên quanh năm mát mẻ với khí hậu ôn đới dịu ngọt, những đồi thông trập trùng, biệt thự kiến trúc Pháp cổ và ngàn loài hoa khoe sắc.',
    bestMonths: 'Tháng 11 - Tháng 4 (Mùa hoa dã quỳ, mai anh đào, đồi cỏ hồng & săn mây)',
    weatherSummary: 'Nhiệt độ 14 - 22°C quanh năm. Sáng se lạnh, trưa nắng ấm, tối lạnh cần áo khoác ấm.',
    cultureHistory: 'Được bác sĩ Alexandre Yersin khám phá năm 1893 và người Pháp xây dựng thành trung tâm nghỉ dưỡng lý tưởng Đông Dương.',
    culturalTaboos: [
      'Không hái hoa bẻ cành tại các vườn hoa công cộng và đồi mai anh đào.',
      'Chú ý lái xe máy số cẩn thận khi xuống các dốc cao quanh co trong sương mù.'
    ],
    transportation: {
      arrival: ['Sân bay Liên Khương (cách Đà Lạt 30km, xe buýt sân bay 40k/lượt)', 'Xe khách giường nằm chất lượng cao từ Sài Gòn (khoảng 6-8 tiếng)'],
      localMove: ['Thuê xe máy', 'Taxi Grab', 'Xe đạp đôi quanh Hồ Xuân Hương'],
      avgBikeRental: '120.000 - 180.000đ/ngày',
      avgTaxiRate: '14.000đ/km'
    },
    imageUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=900&auto=format&fit=crop&q=80',
    pois: [
      {
        id: 'dl-poi-1',
        name: 'Hồ Xuân Hương & Quảng Trường Lâm Viên',
        category: 'Check-in',
        coordinates: { lat: 11.9388, lng: 108.4452 },
        address: 'Trần Quốc Toản, Phường 1, Đà Lạt',
        openingHours: 'Cả ngày',
        ticketPrice: 0,
        estimatedTime: '2 giờ',
        description: 'Trái tim của Đà Lạt với khối nụ hoa Atiso khổng lồ bằng kính màu và hoa dã quỳ cách điệu rực rỡ, nhìn thẳng ra mặt hồ êm ả.',
        imageUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=700&auto=format&fit=crop&q=80',
        tags: ['atiso', 'quảng trường', 'hồ xuân hương', 'check-in'],
        localTips: 'Thuê xe đạp đôi chạy quanh hồ vào buổi chiều tà từ 16h30 để đón hoàng hôn tím ngắt đặc trưng Đà Lạt.',
        rating: 4.8,
        reviewCount: 6120
      },
      {
        id: 'dl-poi-2',
        name: 'Đồi Chè Cầu Đất & Cầu Gỗ Săn Mây',
        category: 'Thiên nhiên',
        coordinates: { lat: 11.8542, lng: 108.5621 },
        address: 'Xã Xuân Trường, Đà Lạt (cách trung tâm 22km)',
        openingHours: '05:00 - 17:30',
        ticketPrice: 50000,
        estimatedTime: '3 giờ',
        description: 'Thảm chè xanh mướt trăm năm tuổi ngút ngàn cùng các tuabin điện gió khổng lồ, điểm săn biển mây bồng bềnh nổi tiếng nhất Lâm Đồng.',
        imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=700&auto=format&fit=crop&q=80',
        tags: ['săn mây', 'đồi chè', 'cầu đất', 'sống ảo'],
        localTips: 'Xuất phát từ trung tâm lúc 4h30 sáng để kịp đón khoảnh khắc mặt trời mọc xuyên qua biển mây lúc 5h30.',
        rating: 4.9,
        reviewCount: 4210
      }
    ],
    foods: [
      {
        id: 'dl-food-1',
        name: 'Lẩu Gà Lá É Tao Ngộ',
        dishName: 'Lẩu gà lá é Đà Lạt',
        category: 'Món chính',
        address: 'Số 5 đường 3 Tháng 4, Phường 3, Đà Lạt',
        coordinates: { lat: 11.9285, lng: 108.4412 },
        priceRange: '200.000 - 350.000đ/nồi 2-4 người',
        avgPrice: 100000,
        bestTime: '18:00 - 21:00 tối se lạnh',
        isMustTry: true,
        isSeasonal: false,
        isLocalFavorite: true,
        description: 'Nồi lẩu bốc khói nghi ngút với nước dùng thơm the dịu nồng của lá é trắng, ớt hiểm xanh cay xé lưỡi, thịt gà đồi săn chắc và nấm sò giòn ngọt.',
        imageUrl: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=600&auto=format&fit=crop&q=80',
        rating: 4.8,
        reviewCount: 3100,
        signatureDish: 'Lẩu gà lá é ớt hiểm cay nồng'
      },
      {
        id: 'dl-food-2',
        name: 'Bánh Tráng Nướng Dì Đinh',
        dishName: 'Bánh tráng nướng (Pizza Đà Lạt)',
        category: 'Ăn vặt & Đường phố',
        address: '26 Hoàng Diệu, Phường 5, Đà Lạt',
        coordinates: { lat: 11.9421, lng: 108.4312 },
        priceRange: '20.000 - 35.000đ',
        avgPrice: 28000,
        bestTime: '16:00 - 22:00',
        isMustTry: true,
        isSeasonal: false,
        isLocalFavorite: true,
        description: 'Bánh tráng mỏng nướng giòn trên bếp than hồng, tráng trứng gà béo, phô mai dẻo, xúc xích, bò khô, hành lá thơm lừng chấm tương ớt cay ngọt.',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
        rating: 4.7,
        reviewCount: 2840,
        signatureDish: 'Bánh tráng nướng thập cẩm phô mai dẻo'
      }
    ],
    festivals: [
      {
        id: 'dl-fest-1',
        name: 'Festival Hoa Đà Lạt',
        provinceId: 'lam-dong',
        provinceName: 'Lâm Đồng',
        solarDate: 'Tháng 12 (Định kỳ 2 năm/lần)',
        lunarDate: 'Tổ chức dịp Giáng sinh & Năm mới',
        scale: 'Quốc gia',
        description: 'Lễ hội tôn vinh nghề trồng hoa truyền thống với hàng trăm không gian hoa nghệ thuật quanh hồ Xuân Hương và diễu hành xe hoa rực rỡ.',
        highlights: ['Không gian hoa nghệ thuật', 'Đêm hội rượu vang & trà', 'Lễ hội áo dài hoa'],
        dressCode: 'Áo khoác đông ấm, khăn choàng thời trang',
        etiquette: 'Không dẫm lên thảm hoa chụp ảnh',
        ticketPrice: 0,
        imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop&q=80'
      }
    ],
    souvenirs: [
      {
        id: 'dl-souv-1',
        name: 'Hồng Treo Gió Công Nghệ Nhật Bản',
        provinceId: 'lam-dong',
        provinceName: 'Lâm Đồng',
        standardPrice: '350.000 - 450.000đ/kg',
        shelfLife: '6 tháng (Bảo quản mát)',
        isOCOP: true,
        ocopStars: 5,
        flightRule: 'Được xách tay',
        flightNote: 'Được đóng gói hút chân không, xách tay lên máy bay hoặc ký gửi an toàn tuyệt đối.',
        trustedAddresses: ['Vườn hồng Lễ Vân - Khe Sanh', 'Cơ sở hồng treo Trạm Hành'],
        imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'dl-souv-2',
        name: 'Cà Phê Arabica Cầu Đất Thượng Hạng',
        provinceId: 'lam-dong',
        provinceName: 'Lâm Đồng',
        standardPrice: '180.000 - 320.000đ/gói 500g',
        shelfLife: '12 tháng',
        isOCOP: true,
        ocopStars: 5,
        flightRule: 'Được xách tay',
        flightNote: 'Hàng khô mang theo dạng hành lý xách tay thoải mái.',
        trustedAddresses: ['Cầu Đất Farm', 'The Married Beans Workspace - Hùng Vương'],
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80'
      }
    ],
    tips: [
      {
        id: 'dl-tip-1',
        title: 'Mẹo tránh mua phải dâu tây Trung Quốc giả danh dâu Đà Lạt',
        category: 'finance',
        content: 'Dâu Đà Lạt chuẩn: Trái không đều chằn chặn, cuống lá tươi xanh tự nhiên, thịt quả mềm mọng nước, vị chua thanh ngọt hậu, chỉ để được 2-3 ngày. Dâu Trung Quốc trái to đều bóng láng, thịt xốp và để được cả tuần không héo.',
        importance: 'Cao',
        tags: ['dâu tây', 'lưu niệm', 'đà lạt']
      }
    ]
  },

  {
    id: 'kien-giang',
    name: 'Kiên Giang (Phú Quốc)',
    region: 'Tây Nam Bộ',
    coordinates: { lat: 10.2289, lng: 103.9572 },
    tagline: 'Đảo Ngọc Phú Quốc — Thiên đường biển nhiệt đới, hoàng hôn ngũ sắc & hải sản',
    description: 'Hòn đảo lớn nhất Việt Nam nổi tiếng với những bãi cát trắng mịn như kem, làn nước ngọc bích trong vắt, rừng nguyên sinh và các tổ hợp giải trí đẳng cấp thế giới.',
    bestMonths: 'Tháng 10 - Tháng 5 năm sau (Mùa khô sóng êm, nước trong như pha lê)',
    weatherSummary: 'Nắng ấm chan hòa quanh năm 27-32°C, gió biển trong lành dễ chịu.',
    cultureHistory: 'Gắn liền với truyền thuyết Vua Gia Long lánh nạn, nghề ủ chài nước mắm truyền thống hơn 200 năm và nghề nuôi cấy ngọc trai quý hiếm.',
    culturalTaboos: [
      'Không bẻ san hô hoặc đứng lên các rạn san hô khi lặn ngắm san hô tại Quần đảo An Thới.',
      'Tuân thủ nghiêm quy định vận chuyển nước mắm trên máy bay.'
    ],
    transportation: {
      arrival: ['Sân bay Quốc tế Phú Quốc (cách thị trấn Dương Đông 10km)', 'Tàu cao tốc từ Rạch Giá / Hà Tiên'],
      localMove: ['Thuê xe máy', 'Xe buýt điện VinBus miễn phí xuyên đảo', 'Taxi Grab'],
      avgBikeRental: '150.000 - 200.000đ/ngày',
      avgTaxiRate: '15.000đ/km'
    },
    imageUrl: 'https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?w=900&auto=format&fit=crop&q=80',
    pois: [
      {
        id: 'pq-poi-1',
        name: 'Bãi Sao & Sunset Sanato',
        category: 'Thiên nhiên',
        coordinates: { lat: 10.0528, lng: 104.0325 },
        address: 'Ấp Bãi Sao, An Thới, Phú Quốc',
        openingHours: '07:00 - 18:30',
        ticketPrice: 0,
        estimatedTime: '3 - 4 giờ',
        description: 'Bãi biển cát trắng mịn nhất Phú Quốc uốn lượn hình lưỡi liềm, rặng dừa nghiêng bóng và điểm ngắm hoàng hôn siêu thực với các tượng điêu khắc nghệ thuật.',
        imageUrl: 'https://images.unsplash.com/photo-1540206351-d6465b3ac5c1?w=700&auto=format&fit=crop&q=80',
        tags: ['bãi sao', 'hoàng hôn', 'biển xanh', 'nghỉ dưỡng'],
        localTips: 'Buổi chiều từ 16h30 đến Sunset Sanato hoặc Bãi Ông Lang để săn khoảnh khắc "Hoàng hôn ngũ sắc" trứ danh Phú Quốc.',
        rating: 4.8,
        reviewCount: 4890
      },
      {
        id: 'pq-poi-2',
        name: 'Cáp Treo Hòn Thơm & Sun World',
        category: 'Giải trí',
        coordinates: { lat: 10.0125, lng: 104.0152 },
        address: 'Thị trấn Hoàng Hôn Sunset Town, An Thới, Phú Quốc',
        openingHours: '08:30 - 17:30',
        ticketPrice: 650000,
        estimatedTime: '4 - 6 giờ',
        description: 'Tuyến cáp treo vượt biển 3 dây dài nhất thế giới (7.899m) nối An Thới sang đảo Hòn Thơm, ngắm trọn làng chài rực rỡ sắc màu từ trên cao.',
        imageUrl: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?w=700&auto=format&fit=crop&q=80',
        tags: ['cáp treo vượt biển', 'hòn thơm', 'công viên nước'],
        localTips: 'Check-in Cầu Hôn (Kiss Bridge) tại Thị trấn Hoàng Hôn trước khi lên cáp treo để có những bức ảnh phong cách Địa Trung Hải.',
        rating: 4.9,
        reviewCount: 5320
      }
    ],
    foods: [
      {
        id: 'pq-food-1',
        name: 'Gỏi Cá Trích Sáng Tươi',
        dishName: 'Gỏi cá trích Phú Quốc',
        category: 'Món chính',
        address: 'Nhà hàng Xin Chào - 66 Trần Hưng Đạo, Dương Đông, Phú Quốc',
        coordinates: { lat: 10.2145, lng: 103.9582 },
        priceRange: '150.000 - 220.000đ/đĩa',
        avgPrice: 180000,
        bestTime: '17:00 - 21:00 tối',
        isMustTry: true,
        isSeasonal: false,
        isLocalFavorite: true,
        description: 'Cá trích tươi sống vừa đánh bắt thái lát mỏng, tái chanh trộn dừa nạo béo ngậy, hành tây, đậu phộng rang cuốn bánh tráng kèm rau rừng và chấm mắm tỏi ớt chua ngọt.',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
        rating: 4.9,
        reviewCount: 2450,
        signatureDish: 'Gỏi cá trích dừa nạo rau rừng'
      },
      {
        id: 'pq-food-2',
        name: 'Bún Quậy Kiến Xây',
        dishName: 'Bún quậy Phú Quốc',
        category: 'Món chính',
        address: '28 Bạch Đằng, Dương Đông, Phú Quốc',
        coordinates: { lat: 10.2188, lng: 103.9625 },
        priceRange: '45.000 - 75.000đ',
        avgPrice: 60000,
        bestTime: '07:30 - 22:00',
        isMustTry: true,
        isSeasonal: false,
        isLocalFavorite: true,
        description: 'Bún tươi ép tại chỗ vào nồi nước dùng sôi sùng sục, chả tôm chả cá tươi quết dính đáy tô được chan nước dùng nóng hổi làm chín tái ngọt thanh.',
        imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80',
        rating: 4.7,
        reviewCount: 4100,
        signatureDish: 'Bún quậy đặc biệt tôm mực bò'
      }
    ],
    festivals: [
      {
        id: 'pq-fest-1',
        name: 'Lễ hội Nghinh Ông Phú Quốc',
        provinceId: 'kien-giang',
        provinceName: 'Kiên Giang',
        solarDate: 'Tháng 10 dương lịch',
        lunarDate: 'Ngày 15-16 tháng 8 âm lịch',
        scale: 'Tỉnh',
        description: 'Lễ hội cầu may lớn nhất của ngư dân đảo Ngọc nhằm tạ ơn Cá Ông bảo vệ tàu thuyền bình an vượt qua sóng to gió lớn.',
        highlights: ['Đoàn thuyền rước Ông trên biển', 'Hát bả trạo', 'Đua thuyền rồng'],
        dressCode: 'Trang phục thoải mái, chống nắng',
        etiquette: 'Tôn trọng nghi lễ cúng thần biển của bà con làng chài',
        ticketPrice: 0,
        imageUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=600&auto=format&fit=crop&q=80'
      }
    ],
    souvenirs: [
      {
        id: 'pq-souv-1',
        name: 'Nước Mắm Truyền Thống Phú Quốc (40-43 Độ Đạm)',
        provinceId: 'kien-giang',
        provinceName: 'Kiên Giang',
        standardPrice: '180.000 - 350.000đ/cặp chai thủy tinh',
        shelfLife: '24 tháng',
        isOCOP: true,
        ocopStars: 5,
        flightRule: 'Bắt buộc ký gửi đóng thùng xốp',
        flightNote: 'QUY ĐỊNH HÀNG KHÔNG: Cấm xách tay. Chỉ được ký gửi khi đóng thùng xốp dán kín băng keo không mùi (tối đa 3 lít/khách). Hầu hết nhà thùng có dịch vụ gửi bưu điện tận nhà.',
        trustedAddresses: ['Nhà thùng Khải Hoàn - Hùng Vương', 'Nhà thùng Thịnh Phát - Đường 30/4'],
        imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'pq-souv-2',
        name: 'Tiêu Chín Phú Quốc & Muối Hồng Tiêu',
        provinceId: 'kien-giang',
        provinceName: 'Kiên Giang',
        standardPrice: '120.000 - 250.000đ/hũ',
        shelfLife: '18 tháng',
        isOCOP: true,
        ocopStars: 4,
        flightRule: 'Được xách tay',
        flightNote: 'Hàng khô được xách tay lên máy bay thoải mái.',
        trustedAddresses: ['Vườn tiêu Ngọc Hà', 'Vườn tiêu Khu Tượng'],
        imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80'
      }
    ],
    tips: [
      {
        id: 'pq-tip-1',
        title: 'Quy định nghiêm ngặt về mang Nước mắm & Sầu riêng lên máy bay',
        category: 'transport',
        content: 'Vietnam Airlines, Vietjet, Bamboo Airways đều CẤM xách tay nước mắm và sầu riêng tươi trong cabin. Nếu mua làm quà: Nước mắm phải yêu cầu đại lý đóng thùng xốp chuyên dụng dán băng dính niêm phong để gửi hành lý ký gửi; Sầu riêng nên mua loại sấy giòn hút chân không.',
        importance: 'Khẩn cấp',
        tags: ['hàng không', 'máy bay', 'nước mắm', 'sầu riêng']
      }
    ]
  },

  {
    id: 'thua-thien-hue',
    name: 'Thừa Thiên Huế',
    region: 'Trung',
    coordinates: { lat: 16.4637, lng: 107.5909 },
    tagline: 'Cố đô Huế — Di sản Hoàng cung triều Nguyễn, Nhã nhạc & Ẩm thực cung đình',
    description: 'Thủ phủ văn hóa lịch sử triều Nguyễn với Đại Nội nguy nga, hệ thống lăng tẩm trầm mặc bên dòng sông Hương và ẩm thực cung đình tinh tế.',
    bestMonths: 'Tháng 1 - 4 (Xuân Cố Đô mát mẻ, hoa sen nở) & Tháng 6 (Festival Huế)',
    weatherSummary: 'Khí hậu giao thoa: Mùa xuân dịu mát 20-25°C, mùa hạ nắng rực rỡ.',
    cultureHistory: 'Kinh đô triều Nguyễn suốt 143 năm (1802 - 1945). Nơi hội tụ các Di sản Ký ức & Văn hóa Phi vật thể thế giới UNESCO.',
    culturalTaboos: [
      'Không được ngồi lên ngai vàng, long sàng hoặc sờ tay vào hiện vật trong Điện Thái Hòa.',
      'Trang phục lịch sự khi viếng lăng Khải Định, Tự Đức, Minh Mạng.'
    ],
    transportation: {
      arrival: ['Sân bay Quốc tế Phú Bài (cách trung tâm 15km)', 'Ga Huế'],
      localMove: ['Xích lô ngắm phố cố đô', 'Thuyền rồng sông Hương', 'Thuê xe máy'],
      avgBikeRental: '100.000 - 130.000đ/ngày',
      avgTaxiRate: '12.500đ/km'
    },
    imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=900&auto=format&fit=crop&q=80',
    pois: [
      {
        id: 'hue-poi-1',
        name: 'Đại Nội Huế (Hoàng Thành & Tử Cấm Thành)',
        category: 'Di sản & Văn hóa',
        coordinates: { lat: 16.4699, lng: 107.5786 },
        address: 'Đường 23 Tháng 8, Phường Thuận Thành, TP. Huế',
        openingHours: '07:30 - 17:30',
        ticketPrice: 200000,
        estimatedTime: '3 - 4 giờ',
        description: 'Quần thể cung điện nguy nga bậc nhất Việt Nam với Ngọ Môn, Điện Thái Hòa, Thế Miếu nơi các Hoàng đế triều Nguyễn ngự trị.',
        imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=700&auto=format&fit=crop&q=80',
        tags: ['đại nội', 'hoàng cung', 'di sản unesco', 'lịch sử'],
        localTips: 'Thuê cổ phục triều Nguyễn (Áo Nhật Bình, Áo Tấc) tại cổng Ngọ Môn để có những bức ảnh cung đình tuyệt mỹ.',
        rating: 4.9,
        reviewCount: 5800
      }
    ],
    foods: [
      {
        id: 'hue-food-1',
        name: 'Bún Bò Huế Mụ Rơi',
        dishName: 'Bún bò Huế truyền thống',
        category: 'Món chính',
        address: '40 Nguyễn Chí Diểu, Thuận Thành, TP. Huế',
        coordinates: { lat: 16.4712, lng: 107.5815 },
        priceRange: '35.000 - 55.000đ',
        avgPrice: 45000,
        bestTime: '06:30 - 10:00 sáng',
        isMustTry: true,
        isSeasonal: false,
        isLocalFavorite: true,
        description: 'Tô bún bò Huế đúng điệu với nước dùng đậm đà hương mắm ruốc và sả tươi, giò heo mềm ngậy, chả cua quết tay và tiết luộc mềm mướt.',
        imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80',
        rating: 4.9,
        reviewCount: 1980,
        signatureDish: 'Bún bò giò heo chả cua đậm đà'
      }
    ],
    festivals: [
      {
        id: 'hue-fest-1',
        name: 'Festival Huế (Festival Nghề Truyền Thống)',
        provinceId: 'thua-thien-hue',
        provinceName: 'Thừa Thiên Huế',
        solarDate: 'Tháng 4 hoặc Tháng 6',
        lunarDate: 'Tổ chức định kỳ mùa lễ hội',
        scale: 'Quốc gia',
        description: 'Lễ hội văn hóa nghệ thuật tầm cỡ quốc tế tái hiện các nghi lễ cung đình triều Nguyễn, đêm hoàng cung và nhã nhạc trên sông Hương.',
        highlights: ['Đêm Hoàng Cung', 'Lễ Tế Giao', 'Áo Dài Show thực cảnh'],
        dressCode: 'Áo dài hoặc trang phục thanh lịch',
        etiquette: 'Giữ không gian trang nghiêm khi diễn ra các nghi lễ hoàng tộc',
        ticketPrice: 150000,
        imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&auto=format&fit=crop&q=80'
      }
    ],
    souvenirs: [
      {
        id: 'hue-souv-1',
        name: 'Mè Xửng Huế & Trà Cung Đình',
        provinceId: 'thua-thien-hue',
        provinceName: 'Thừa Thiên Huế',
        standardPrice: '40.000 - 90.000đ/gói',
        shelfLife: '6 tháng',
        isOCOP: true,
        ocopStars: 4,
        flightRule: 'Được xách tay',
        flightNote: 'Hàng khô được mang xách tay lên máy bay thoải mái.',
        trustedAddresses: ['Mè xửng Thiên Hương - 138 Chi Lăng', 'Trà Cung Đình Đức Phượng - 24 Nguyễn Huệ'],
        imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80'
      }
    ],
    tips: [
      {
        id: 'hue-tip-1',
        title: 'Kinh nghiệm đi thuyền rồng nghe Ca Huế trên sông Hương',
        category: 'culture',
        content: 'Chỉ mua vé tại bến thuyền Tòa Khâm chính thức (100k - 150k/vé). Thuyền chạy lúc 19h00 và 20h00, ngắm cầu Tràng Tiền đổi màu và được thả hoa đăng cầu may.',
        importance: 'Cao',
        tags: ['huế', 'ca huế', 'sông hương']
      }
    ]
  },

  {
    id: 'quang-ninh',
    name: 'Quảng Ninh (Vịnh Hạ Long)',
    region: 'Bắc',
    coordinates: { lat: 20.9505, lng: 107.0734 },
    tagline: 'Kỳ quan Thiên nhiên Thế giới — Hàng ngàn đảo đá vôi kỳ vĩ & vịnh ngọc',
    description: 'Di sản Thiên nhiên Thế giới UNESCO với gần 2.000 hòn đảo đá vôi nhô lên giữa làn nước xanh ngọc bích, các hang động thạch nhũ lung linh và du thuyền sang trọng.',
    bestMonths: 'Tháng 4 - 6 & Tháng 9 - 11 (Trời trong xanh, biển lặng, nắng ấm)',
    weatherSummary: 'Khí hậu biển Bắc Bộ trong lành, mùa hè lộng gió mát rượi.',
    cultureHistory: 'Lưu giữ dấu tích văn hóa tiền sử Soi Nhụ, Cái Bèo và gắn liền chiến thắng Bạch Đằng giang lẫy lừng.',
    culturalTaboos: [
      'Tuyệt đối không xả rác hay túi nilon xuống vịnh biển.',
      'Tuân thủ mặc áo phao cứu sinh khi chèo thuyền kayak và cano.'
    ],
    transportation: {
      arrival: ['Sân bay Quốc tế Vân Đồn (cách Hạ Long 50km)', 'Cao tốc Hà Nội - Hải Phòng - Hạ Long (chỉ mất 1h45 phút di chuyển xe limousine)'],
      localMove: ['Du thuyền thăm vịnh trong ngày hoặc ngủ đêm', 'Taxi', 'Cáp treo Nữ Hoàng'],
      avgBikeRental: '120.000 - 150.000đ/ngày',
      avgTaxiRate: '14.000đ/km'
    },
    imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=900&auto=format&fit=crop&q=80',
    pois: [
      {
        id: 'qn-poi-1',
        name: 'Vịnh Hạ Long & Hang Sửng Sốt',
        category: 'Thiên nhiên',
        coordinates: { lat: 20.9101, lng: 107.085 },
        address: 'Bến tàu Tuần Châu / Cảng Quốc tế Hạ Long',
        openingHours: '07:30 - 16:30',
        ticketPrice: 290000,
        estimatedTime: '4 - 6 giờ',
        description: 'Hang động đá vôi rộng lớn và tráng lệ nhất vịnh Hạ Long với hàng ngàn nhũ đá hóa thạch muôn hình vạn trạng kỳ ảo.',
        imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=700&auto=format&fit=crop&q=80',
        tags: ['vịnh hạ long', 'kỳ quan thế giới', 'hang sửng sốt', 'du thuyền'],
        localTips: 'Chọn tour du thuyền tuyến 2 (Hang Sửng Sốt - Đảo Ti Tốp - Hang Luồn chèo Kayak) là cung đường đẹp nhất.',
        rating: 4.9,
        reviewCount: 7120
      }
    ],
    foods: [
      {
        id: 'qn-food-1',
        name: 'Bánh Cuốn Chả Mực Thoan',
        dishName: 'Bánh cuốn chả mực giã tay',
        category: 'Món chính',
        address: 'Kiot 36-37 Chợ Hạ Long 1, TP. Hạ Long',
        coordinates: { lat: 20.9532, lng: 107.0812 },
        priceRange: '40.000 - 60.000đ',
        avgPrice: 50000,
        bestTime: '06:30 - 11:00 sáng',
        isMustTry: true,
        isSeasonal: false,
        isLocalFavorite: true,
        description: 'Chả mực tươi rói giã tay truyền thống giữ nguyên độ giòn sần sật ngọt lịm, ăn cùng bánh cuốn tráng mỏng mềm mướt và nước chấm hạt tiêu thơm cay.',
        imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80',
        rating: 4.9,
        reviewCount: 3210,
        signatureDish: 'Chả mực giã tay chiên vàng nóng hổi'
      }
    ],
    festivals: [
      {
        id: 'qn-fest-1',
        name: 'Carnaval Hạ Long',
        provinceId: 'quang-ninh',
        provinceName: 'Quảng Ninh',
        solarDate: 'Dịp lễ 30/4 - 1/5 hàng năm',
        lunarDate: 'Tổ chức theo lịch lễ hội mùa hè',
        scale: 'Quốc gia',
        description: 'Lễ hội đường phố rực rỡ sắc màu với vũ đoàn quốc tế, diễu hành cano trên biển và pháo hoa tầm cao bên bờ vịnh.',
        highlights: ['Vũ hội đường phố', 'Trình diễn drone ánh sáng', 'Bắn pháo hoa'],
        dressCode: 'Thời trang mùa hè năng động',
        etiquette: 'Đến sớm trước 19h để chọn vị trí đứng xem dọc đường bao biển Bãi Cháy',
        ticketPrice: 0,
        imageUrl: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=600&auto=format&fit=crop&q=80'
      }
    ],
    souvenirs: [
      {
        id: 'qn-souv-1',
        name: 'Chả Mực Giã Tay Hạ Long (Hút Chân Không)',
        provinceId: 'quang-ninh',
        provinceName: 'Quảng Ninh',
        standardPrice: '450.000 - 550.000đ/kg',
        shelfLife: '3 ngày (mát) | 3 tháng (ngăn đông)',
        isOCOP: true,
        ocopStars: 5,
        flightRule: 'Được xách tay',
        flightNote: 'Yêu cầu đóng gói hút chân không và bọc giấy báo/túi giữ nhiệt để xách tay máy bay.',
        trustedAddresses: ['Chả mực Thoan - Chợ Hạ Long 1', 'Chả mực Bá Kiến'],
        imageUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80'
      }
    ],
    tips: [
      {
        id: 'qn-tip-1',
        title: 'Mẹo leo đỉnh đảo Ti Tốp ngắm trọn vịnh Hạ Long',
        category: 'timing',
        content: 'Chinh phục 400 bậc đá lên đài quan sát đảo Ti Tốp vào buổi chiều tầm 16h00 để ngắm hoàng hôn buông đỏ rực trên hàng ngàn đảo đá vôi mà không bị nắng gắt.',
        importance: 'Cao',
        tags: ['ti tốp', 'hạ long', 'leo núi']
      }
    ]
  },

  {
    id: 'ninh-binh',
    name: 'Ninh Bình',
    region: 'Bắc',
    coordinates: { lat: 20.2506, lng: 105.9745 },
    tagline: 'Tràng An — Vịnh Hạ Long trên cạn, Cố đô Hoa Lư & Hang Múa kỳ vĩ',
    description: 'Di sản Văn hóa và Thiên nhiên Thế giới kép duy nhất tại Đông Nam Á với quần thể sông nước uốn lượn qua các dãy núi đá vôi triệu năm và thảm lúa vàng Tam Cốc.',
    bestMonths: 'Tháng 1 - 3 (Lễ hội chùa Bái Đính) & Tháng 5 - 6 (Mùa lúa chín vàng Tam Cốc)',
    weatherSummary: 'Nắng ấm trong veo, dòng nước trong vắt nhìn thấu rong rêu.',
    cultureHistory: 'Kinh đô đầu tiên của nhà nước phong kiến tập quyền Đại Cồ Việt thời Đinh - Tiền Lê.',
    culturalTaboos: [
      'Mặc áo phao suốt hành trình đi thuyền chèo Tràng An / Tam Cốc.',
      'Tips bồi dưỡng cho cô chú chèo thuyền (thông lệ lịch sự: 50k - 100k/thuyền).'
    ],
    transportation: {
      arrival: ['Xe Limousine từ Hà Nội (khoảng 1h15 phút)', 'Tàu hỏa ga Ninh Bình'],
      localMove: ['Xe máy', 'Xe đạp dạo đồng lúa', 'Thuyền chèo tay'],
      avgBikeRental: '100.000 - 130.000đ/ngày',
      avgTaxiRate: '12.000đ/km'
    },
    imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=900&auto=format&fit=crop&q=80',
    pois: [
      {
        id: 'nb-poi-1',
        name: 'Quần Thể Danh Thắng Tràng An',
        category: 'Thiên nhiên',
        coordinates: { lat: 20.2536, lng: 105.908 },
        address: 'Tràng An, Hoa Lư, Ninh Bình',
        openingHours: '07:00 - 16:30',
        ticketPrice: 250000,
        estimatedTime: '3 giờ',
        description: 'Ngồi thuyền nan trôi theo dòng nước biếc xuyên qua 9 hang động huyền ảo và thăm phim trường King Kong: Skull Island.',
        imageUrl: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=700&auto=format&fit=crop&q=80',
        tags: ['tràng an', 'di sản kép unesco', 'thuyền chèo', 'hang động'],
        localTips: 'Chọn Tuyến 3 (Hang Mây dài 1.000m) hoặc Tuyến 2 để có hành trình hang động đẹp và ít đông nhất.',
        rating: 4.9,
        reviewCount: 6540
      },
      {
        id: 'nb-poi-2',
        name: 'Hang Múa & Đỉnh Ngọa Long',
        category: 'Check-in',
        coordinates: { lat: 20.2315, lng: 105.9324 },
        address: 'Thôn Khê Hạ, Ninh Xuân, Hoa Lư, Ninh Bình',
        openingHours: '06:00 - 19:00',
        ticketPrice: 100000,
        estimatedTime: '2 giờ',
        description: 'Chinh phục 486 bậc thang đá mô phỏng Vạn Lý Trường Thành thu nhỏ lên đỉnh núi Múa ngắm trọn toàn cảnh thung lũng Tam Cốc lộng lẫy.',
        imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=700&auto=format&fit=crop&q=80',
        tags: ['hang múa', 'ngọa long', 'view tam cốc', 'check-in'],
        localTips: 'Leo núi vào lúc 6h30 sáng hoặc 16h30 chiều để ngắm bình minh/hoàng hôn và tránh thời tiết nắng gắt trưa.',
        rating: 4.8,
        reviewCount: 4890
      }
    ],
    foods: [
      {
        id: 'nb-food-1',
        name: 'Thịt Dê Núi & Cơm Cháy Ninh Bình',
        dishName: 'Dê núi tái chanh & cơm cháy ruốc',
        category: 'Món chính',
        address: 'Nhà hàng Chính Thư - Thôn Khê Thượng, Hoa Lư, Ninh Bình',
        coordinates: { lat: 20.2452, lng: 105.9185 },
        priceRange: '150.000 - 250.000đ/người',
        avgPrice: 180000,
        bestTime: '11:30 - 14:00 trưa',
        isMustTry: true,
        isSeasonal: false,
        isLocalFavorite: true,
        description: 'Thịt dê nuôi thả rông trên vách đá vôi ăn lá thuốc nên thịt thơm ngọt săn chắc không hề có mùi hôi, chấm tương bần gừng ăn kèm cơm cháy giòn rụm.',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
        rating: 4.8,
        reviewCount: 2900,
        signatureDish: 'Dê tái chanh tương gừng & dê nướng tảng'
      }
    ],
    festivals: [
      {
        id: 'nb-fest-1',
        name: 'Lễ Hội Cố Đô Hoa Lư',
        provinceId: 'ninh-binh',
        provinceName: 'Ninh Bình',
        solarDate: 'Tháng 4 dương lịch',
        lunarDate: 'Ngày 8 - 10 tháng 3 âm lịch',
        scale: 'Tỉnh',
        description: 'Tưởng nhớ công đức Vua Đinh Tiên Hoàng và Vua Lê Đại Hành với các màn cờ lau tập trận và rước nước sông Hoàng Long.',
        highlights: ['Tái hiện cờ lau tập trận', 'Rước kiệu thánh', 'Kéo chữ nghệ thuật'],
        dressCode: 'Lịch sự, tôn kính',
        etiquette: 'Không chen lấn khi đoàn rước nước đi qua',
        ticketPrice: 20000,
        imageUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=600&auto=format&fit=crop&q=80'
      }
    ],
    souvenirs: [
      {
        id: 'nb-souv-1',
        name: 'Cơm Cháy Chà Bông Ninh Bình OCOP',
        provinceId: 'ninh-binh',
        provinceName: 'Ninh Bình',
        standardPrice: '35.000 - 50.000đ/gói',
        shelfLife: '6 tháng',
        isOCOP: true,
        ocopStars: 4,
        flightRule: 'Được xách tay',
        flightNote: 'Hàng khô mang xách tay hoặc gửi hành lý rất an toàn.',
        trustedAddresses: ['Cơm cháy Khải Hoa', 'Cơm cháy Đại Long'],
        imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80'
      }
    ],
    tips: [
      {
        id: 'nb-tip-1',
        title: 'Mẹo đi thuyền Tràng An không bị mỏi lưng & chụp ảnh đẹp',
        category: 'timing',
        content: 'Chuyến thuyền kéo dài khoảng 2.5 - 3 tiếng. Mang theo nón lá hoặc ô che nắng, kính râm và một chai nước suối nhỏ. Hãy lịch sự hỏi chú lái đò dừng lại 1-2 phút ở khúc sông có núi non phản chiếu để chụp ảnh.',
        importance: 'Cao',
        tags: ['tràng an', 'kinh nghiệm', 'thuyền nan']
      }
    ]
  },

  {
    id: 'tp-ho-chi-minh',
    name: 'TP. Hồ Chí Minh (Sài Gòn)',
    region: 'Nam',
    coordinates: { lat: 10.8231, lng: 106.6297 },
    tagline: 'Sài Gòn hoa lệ — Siêu đô thị năng động, thiên đường ẩm thực & văn hóa đa sắc',
    description: 'Hòn ngọc Viễn Đông không bao giờ ngủ với nhịp sống hối hả, các tòa nhà chọc trời hiện đại đan xen công trình kiến trúc Pháp cổ và văn hóa cà phê vỉa hè phóng khoáng.',
    bestMonths: 'Tháng 12 - Tháng 4 (Mùa khô nắng rực rỡ, trời trong xanh, không mưa)',
    weatherSummary: 'Nhiệt độ 26 - 35°C quanh năm. Mùa mưa (Tháng 5-11) thường chỉ có những cơn mưa rào nhanh buổi chiều.',
    cultureHistory: 'Hơn 300 năm hình thành và phát triển từ vùng đất Gia Định xưa, trung tâm tài chính và đổi mới sáng tạo lớn nhất cả nước.',
    culturalTaboos: [
      'Chú ý bảo quản điện thoại, túi xách cẩn thận khi đứng nghe điện thoại sát mép đường.',
      'Ăn mặc lịch sự khi tham quan Bưu Điện Thành Phố, Dinh Độc Lập, Bảo tàng Chứng tích Chiến tranh.'
    ],
    transportation: {
      arrival: ['Sân bay Quốc tế Tân Sơn Nhất', 'Ga Sài Gòn (Quận 3)', 'Bến xe Miền Đông mới'],
      localMove: ['Xe buýt sông Saigon Waterbus (15k/vé)', 'Metro Bến Thành - Suối Tiên', 'Grab/Be/Xanh SM', 'Xe buýt 2 tầng'],
      avgBikeRental: '120.000 - 160.000đ/ngày',
      avgTaxiRate: '15.000đ/km'
    },
    imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=900&auto=format&fit=crop&q=80',
    pois: [
      {
        id: 'hcm-poi-1',
        name: 'Dinh Độc Lập & Nhà Thờ Đức Bà',
        category: 'Di sản & Văn hóa',
        coordinates: { lat: 10.777, lng: 106.6953 },
        address: '135 Nam Kỳ Khởi Nghĩa, Bến Thành, Quận 1, TP.HCM',
        openingHours: '08:00 - 16:30',
        ticketPrice: 65000,
        estimatedTime: '2.5 giờ',
        description: 'Chứng tích lịch sử vĩ đại ghi dấu ngày thống nhất đất nước 30/4/1975 với kiến trúc phong thủy hiện đại kết hợp truyền thống Á Đông.',
        imageUrl: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=700&auto=format&fit=crop&q=80',
        tags: ['dinh độc lập', 'lịch sử', 'quận 1', 'kiến trúc'],
        localTips: 'Đi bộ sang công viên 30/4 đối diện thưởng thức cà phê bệt Sài Gòn ngắm bồ câu bay lượn.',
        rating: 4.8,
        reviewCount: 6890
      },
      {
        id: 'hcm-poi-2',
        name: 'Saigon Waterbus & Bến Bạch Đằng',
        category: 'Check-in',
        coordinates: { lat: 10.7745, lng: 106.7065 },
        address: 'Ga Tàu Thủy Bạch Đằng, Tôn Đức Thắng, Quận 1, TP.HCM',
        openingHours: '07:00 - 21:00',
        ticketPrice: 15000,
        estimatedTime: '1.5 giờ',
        description: 'Trải nghiệm du ngoạn sông Sài Gòn giá rẻ ngắm Landmark 81 và các tòa cao ốc lấp lánh phản chiếu xuống mặt nước.',
        imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=700&auto=format&fit=crop&q=80',
        tags: ['waterbus', 'sông sài gòn', 'hoàng hôn', 'landmark 81'],
        localTips: 'Đặt vé online trước chuyến 17h00 ngắm hoàng hôn buông trên sông và thành phố lên đèn lung linh.',
        rating: 4.9,
        reviewCount: 5120
      }
    ],
    foods: [
      {
        id: 'hcm-food-1',
        name: 'Cơm Tấm Ba Ghiền',
        dishName: 'Cơm tấm sườn bì chả ốp la',
        category: 'Món chính',
        address: '84 Đặng Văn Ngữ, Phường 10, Phú Nhuận, TP.HCM',
        coordinates: { lat: 10.7938, lng: 106.6712 },
        priceRange: '70.000 - 110.000đ',
        avgPrice: 85000,
        bestTime: '07:30 - 21:00',
        isMustTry: true,
        isSeasonal: false,
        isLocalFavorite: true,
        description: 'Đĩa cơm tấm gạo tấm thơm dẻo với miếng sườn nướng khổng lồ ướp mật ong vàng óng, chả trứng béo ngậy, mỡ hành tóp mỡ và nước mắm kẹo đậm đà.',
        imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
        rating: 4.8,
        reviewCount: 3980,
        signatureDish: 'Cơm tấm sườn cây chả trứng'
      },
      {
        id: 'hcm-food-2',
        name: 'Hủ Tiếu Nam Vang Nhân Quán',
        dishName: 'Hủ tiếu Nam Vang khô / nước',
        category: 'Món chính',
        address: '122 Nguyễn Trãi, Phường 3, Quận 5, TP.HCM',
        coordinates: { lat: 10.7582, lng: 106.6815 },
        priceRange: '65.000 - 90.000đ',
        avgPrice: 75000,
        bestTime: '06:00 - 23:00',
        isMustTry: true,
        isSeasonal: false,
        isLocalFavorite: true,
        description: 'Sợi hủ tiếu dai trộn sốt tương đen bí truyền, phủ đầy tôm tươi bóc vỏ, thịt băm, gan heo, trứng cút kèm bát nước lèo xương ngọt thanh nghi ngút khói.',
        imageUrl: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80',
        rating: 4.7,
        reviewCount: 2980,
        signatureDish: 'Hủ tiếu khô thập cẩm tôm thịt'
      }
    ],
    festivals: [
      {
        id: 'hcm-fest-1',
        name: 'Lễ hội Sông Nước TP. Hồ Chí Minh',
        provinceId: 'tp-ho-chi-minh',
        provinceName: 'TP. Hồ Chí Minh',
        solarDate: 'Tháng 6 hàng năm',
        lunarDate: 'Tổ chức vào mùa hè',
        scale: 'Tỉnh',
        description: 'Chuỗi sự kiện văn hóa nghệ thuật và thể thao dưới nước hoành tráng trên sông Sài Gòn với show thực cảnh "Chuyến tàu huyền thoại".',
        highlights: ['Show diễn thực cảnh sông nước', 'Đua thuyền rồng truyền thống', 'Chợ nổi trái cây miền Tây'],
        dressCode: 'Thời trang thoải mái, năng động',
        etiquette: 'Đến sớm tại Công viên Bến Bạch Đằng để có chỗ ngắm trình diễn pháo hoa nghệ thuật',
        ticketPrice: 0,
        imageUrl: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=600&auto=format&fit=crop&q=80'
      }
    ],
    souvenirs: [
      {
        id: 'hcm-souv-1',
        name: 'Cà Phê Phin Sài Gòn & Socola Marou Thủ Công',
        provinceId: 'tp-ho-chi-minh',
        provinceName: 'TP. Hồ Chí Minh',
        standardPrice: '120.000 - 250.000đ/hộp',
        shelfLife: '12 tháng',
        isOCOP: true,
        ocopStars: 5,
        flightRule: 'Được xách tay',
        flightNote: 'Hàng khô mang xách tay hoặc gửi quốc tế thoải mái.',
        trustedAddresses: ['Maison Marou Saigon - 169 Calmette, Quận 1', 'Cà phê Trung Nguyên Legend'],
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80'
      }
    ],
    tips: [
      {
        id: 'hcm-tip-1',
        title: 'Mẹo an toàn bảo quản tư trang khi dạo phố đi bộ Bùi Viện & Nguyễn Huệ',
        category: 'safety',
        content: 'Đeo balo ngược ra trước ngực khi vào khu vực đông người. Không cầm điện thoại hớ hênh khi đứng chụp ảnh sát lòng đường có xe máy chạy qua.',
        importance: 'Cao',
        tags: ['an toàn', 'sài gòn', 'bùi viện']
      }
    ]
  }
];

// Helper functions for easy querying and RAG extraction
export function getProvinceById(id: string): Province | undefined {
  return PROVINCES.find(p => p.id === id);
}

export function searchAllPOIs(query: string): POI[] {
  const q = query.toLowerCase().trim();
  const results: POI[] = [];
  PROVINCES.forEach(p => {
    p.pois.forEach(poi => {
      if (
        poi.name.toLowerCase().includes(q) ||
        poi.description.toLowerCase().includes(q) ||
        poi.category.toLowerCase().includes(q) ||
        poi.tags.some(t => t.toLowerCase().includes(q))
      ) {
        results.push(poi);
      }
    });
  });
  return results;
}

export function searchAllFoods(query: string): FoodSpot[] {
  const q = query.toLowerCase().trim();
  const results: FoodSpot[] = [];
  PROVINCES.forEach(p => {
    p.foods.forEach(f => {
      if (
        f.name.toLowerCase().includes(q) ||
        f.dishName.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
      ) {
        results.push(f);
      }
    });
  });
  return results;
}

export function getTipsByCategory(category?: string, provinceId?: string): TravelTip[] {
  let list = [...ALL_TIPS];
  PROVINCES.forEach(p => {
    list.push(...p.tips);
  });
  if (category && category !== 'all') {
    list = list.filter(t => t.category === category);
  }
  if (provinceId && provinceId !== 'all') {
    list = list.filter(t => !t.provinceId || t.provinceId === provinceId);
  }
  return list;
}
