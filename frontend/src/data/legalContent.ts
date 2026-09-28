// ============================================================================
// Điều khoản dịch vụ & Chính sách quyền riêng tư của VietGo.
// Nội dung dựa trên dữ liệu và dịch vụ thực tế của dự án (xem từng mục).
//
// ⚠️ Các giá trị trong [ngoặc vuông] là thông tin pháp nhân cần điền trước khi
// phát hành. UI tự tô vàng các chỗ này để dễ nhận biết.
// Nên nhờ luật sư rà soát lần cuối trước khi áp dụng chính thức.
// ============================================================================

export const LEGAL_INFO = {
  companyName: '[Tên pháp nhân vận hành VietGo]',
  address: '[Địa chỉ trụ sở]',
  businessCode: '[Mã số doanh nghiệp]',
  supportEmail: '[support@vietgo.vn]',
  privacyEmail: '[privacy@vietgo.vn]',
  hotline: '[Số hotline]',
  effectiveDate: '28/09/2026',
  version: '1.0'
};

export type LegalBlock =
  | string
  | { type: 'list'; items: string[] }
  | { type: 'table'; head: string[]; rows: string[][] }
  | { type: 'note'; tone: 'info' | 'warning'; text: string };

export interface LegalSection {
  id: string;
  heading: string;
  blocks: LegalBlock[];
}

export interface LegalDocument {
  id: 'terms' | 'privacy';
  title: string;
  summary: string;
  sections: LegalSection[];
}

const { companyName, address, businessCode, supportEmail, privacyEmail, hotline } = LEGAL_INFO;

// ============================================================================
// ĐIỀU KHOẢN DỊCH VỤ
// ============================================================================

export const TERMS_OF_SERVICE: LegalDocument = {
  id: 'terms',
  title: 'Điều khoản dịch vụ',
  summary:
    'Các quy định khi bạn sử dụng VietGo: tài khoản, trợ lý AI, lịch trình, đặt chỗ, thông tin cứu hộ và trách nhiệm của mỗi bên.',
  sections: [
    {
      id: 'gioi-thieu',
      heading: '1. Giới thiệu và phạm vi áp dụng',
      blocks: [
        `VietGo ("VietGo", "chúng tôi") là nền tảng trợ lý du lịch Việt Nam do ${companyName} (mã số doanh nghiệp ${businessCode}, trụ sở tại ${address}) vận hành, cung cấp qua website và các ứng dụng liên quan ("Dịch vụ").`,
        'Điều khoản dịch vụ này ("Điều khoản") là thỏa thuận giữa bạn và VietGo. Khi tạo tài khoản, đăng nhập bằng Google hoặc tiếp tục sử dụng Dịch vụ, bạn xác nhận đã đọc, hiểu và đồng ý với Điều khoản này cùng Chính sách quyền riêng tư.',
        'Nếu không đồng ý, vui lòng ngừng sử dụng Dịch vụ.'
      ]
    },
    {
      id: 'dich-vu',
      heading: '2. Dịch vụ VietGo cung cấp',
      blocks: [
        {
          type: 'list',
          items: [
            'Khám phá: thông tin tỉnh thành, điểm đến, món ăn đặc sản, lễ hội và sự kiện trên khắp Việt Nam.',
            'Xung quanh: gợi ý địa điểm gần vị trí hiện tại của bạn (khi bạn cho phép truy cập vị trí).',
            'Trợ lý AI: trò chuyện, tư vấn du lịch và tạo/chỉnh sửa lịch trình tự động bằng trí tuệ nhân tạo.',
            'Lịch trình và Quản lý chi tiêu: lập kế hoạch chuyến đi, ghi chép chi phí, quét hóa đơn bằng AI.',
            'Danh sách yêu thích và Hồ sơ Travel DNA: lưu địa điểm, sở thích du lịch và ăn uống để cá nhân hóa gợi ý.',
            'Đặt bàn / vé: gửi yêu cầu giữ chỗ tới nhà hàng, lễ hội hoặc đối tác địa phương.',
            'Thông tin cứu hộ khẩn cấp (SOS): tổng hợp số điện thoại khẩn cấp và đường dây hỗ trợ du khách.'
          ]
        },
        'VietGo có thể bổ sung, thay đổi hoặc tạm ngưng một phần Dịch vụ để nâng cấp, bảo trì hoặc vì lý do pháp lý. Với thay đổi ảnh hưởng đáng kể đến bạn, chúng tôi sẽ thông báo trước trong ứng dụng khi có thể.'
      ]
    },
    {
      id: 'tai-khoan',
      heading: '3. Tài khoản người dùng',
      blocks: [
        'Bạn có thể dùng một số tính năng mà không cần tài khoản. Để lưu hồ sơ, Travel DNA và đồng bộ trải nghiệm, bạn cần tạo tài khoản bằng một trong hai cách:',
        {
          type: 'list',
          items: [
            'Tài khoản VietGo: tên đăng nhập, họ và tên, mật khẩu; Gmail và số điện thoại là không bắt buộc.',
            'Đăng nhập bằng Google: VietGo nhận họ tên, địa chỉ Gmail và ảnh đại diện từ tài khoản Google bạn chọn.'
          ]
        },
        'Khi sử dụng tài khoản, bạn cam kết:',
        {
          type: 'list',
          items: [
            'Cung cấp thông tin chính xác, không mạo danh người khác và không dùng tên đăng nhập gây hiểu nhầm, xúc phạm hoặc vi phạm pháp luật.',
            'Tự bảo mật mật khẩu và mã xác nhận (OTP); không chia sẻ tài khoản cho người khác.',
            'Chịu trách nhiệm về mọi hoạt động diễn ra dưới tài khoản của mình, trừ trường hợp lỗi thuộc về VietGo.',
            `Thông báo ngay cho chúng tôi qua ${supportEmail} khi phát hiện tài khoản bị truy cập trái phép.`
          ]
        },
        'Để bảo vệ tài khoản, VietGo áp dụng các biện pháp như: tạm khóa đăng nhập bằng mật khẩu 5 phút sau 5 lần nhập sai; chỉ cho phép khôi phục mật khẩu qua Gmail hoặc số điện thoại đã xác minh; không cho hủy liên kết Google nếu tài khoản chưa có mật khẩu.',
        {
          type: 'note',
          tone: 'info',
          text: 'Hãy xác minh ít nhất một Gmail hoặc số điện thoại trong Hồ sơ cá nhân. Nếu chưa xác minh, VietGo không thể giúp bạn lấy lại tài khoản khi quên mật khẩu.'
        }
      ]
    },
    {
      id: 'do-tuoi',
      heading: '4. Điều kiện về độ tuổi',
      blocks: [
        'Bạn phải từ đủ 16 tuổi trở lên để tự tạo tài khoản. Người dưới 16 tuổi chỉ được sử dụng Dịch vụ khi có sự đồng ý và giám sát của cha, mẹ hoặc người giám hộ hợp pháp.',
        'Nếu phát hiện tài khoản của trẻ em được tạo mà không có sự đồng ý phù hợp, VietGo có quyền tạm khóa và xóa dữ liệu liên quan.'
      ]
    },
    {
      id: 'ai',
      heading: '5. Trợ lý AI và nội dung tự động',
      blocks: [
        'Trợ lý AI, lịch trình tự động và tính năng quét hóa đơn sử dụng mô hình trí tuệ nhân tạo (Google Gemini). Nội dung do AI tạo ra:',
        {
          type: 'list',
          items: [
            'Chỉ mang tính tham khảo, có thể chưa chính xác, chưa đầy đủ hoặc chưa cập nhật (giá vé, giờ mở cửa, thời tiết, tình trạng giao thông, quy định địa phương...).',
            'Không phải là tư vấn pháp lý, y tế, tài chính hay an toàn chuyên nghiệp.',
            'Có thể khác nhau giữa các lần hỏi dù cùng một câu hỏi.'
          ]
        },
        'Bạn nên tự kiểm chứng thông tin quan trọng với nguồn chính thức trước khi ra quyết định. Với người có dị ứng thực phẩm, luôn xác nhận trực tiếp với nhà hàng — gợi ý dựa trên Travel DNA không đảm bảo món ăn an toàn cho bạn.',
        'Không nhập vào khung chat AI các thông tin nhạy cảm không cần thiết (số CCCD, số thẻ ngân hàng, mật khẩu...).'
      ]
    },
    {
      id: 'dat-cho',
      heading: '6. Đặt bàn, đặt vé và giao dịch với bên thứ ba',
      blocks: [
        'Nhà hàng, cơ sở lưu trú, ban tổ chức lễ hội và các đối tác địa phương ("Nhà cung cấp") là bên trực tiếp cung cấp dịch vụ cho bạn. VietGo đóng vai trò chuyển yêu cầu và hiển thị thông tin.',
        {
          type: 'list',
          items: [
            'Mã đặt chỗ do VietGo cấp là mã tham chiếu cho yêu cầu của bạn. Việc giữ chỗ chỉ có hiệu lực khi được Nhà cung cấp xác nhận.',
            'Giá, ưu đãi, chính sách hủy và hoàn tiền tuân theo quy định của từng Nhà cung cấp.',
            'Ưu đãi "Đối tác bản địa" (nếu có) phụ thuộc vào chương trình của Nhà cung cấp tại thời điểm sử dụng.',
            'Bạn cần cung cấp đúng họ tên, số điện thoại và số lượng khách để Nhà cung cấp liên hệ xác nhận.'
          ]
        },
        'Ứng dụng có thể chứa liên kết tới website, trang mạng xã hội của Nhà cung cấp hoặc bên thứ ba. VietGo không kiểm soát và không chịu trách nhiệm về nội dung, chính sách của các trang đó.'
      ]
    },
    {
      id: 'sos',
      heading: '7. Thông tin cứu hộ khẩn cấp (SOS)',
      blocks: [
        {
          type: 'note',
          tone: 'warning',
          text: 'VietGo KHÔNG phải là dịch vụ cấp cứu hay cứu hộ. Trong tình huống khẩn cấp, hãy gọi trực tiếp: 112 (cứu nạn, cứu hộ), 113 (công an), 114 (cứu hỏa), 115 (cấp cứu y tế).'
        },
        'Danh bạ khẩn cấp và đường dây hỗ trợ du khách trong ứng dụng được tổng hợp từ nguồn công khai và có thể thay đổi. Cuộc gọi được thực hiện qua ứng dụng điện thoại của thiết bị bạn; VietGo không kết nối, ghi âm hay can thiệp vào cuộc gọi và không đảm bảo khả năng kết nối của nhà mạng.'
      ]
    },
    {
      id: 'hanh-vi',
      heading: '8. Hành vi bị nghiêm cấm',
      blocks: [
        'Khi sử dụng VietGo, bạn không được:',
        {
          type: 'list',
          items: [
            'Vi phạm pháp luật Việt Nam, xâm phạm quyền và lợi ích hợp pháp của người khác.',
            'Đăng tải, gửi nội dung sai sự thật, xúc phạm, khiêu dâm, bạo lực, phân biệt đối xử hoặc chống phá Nhà nước.',
            'Tạo nhiều tài khoản để gian lận, spam, đặt chỗ ảo hoặc gây thiệt hại cho Nhà cung cấp.',
            'Dò mật khẩu, khai thác lỗ hổng, can thiệp, làm quá tải hệ thống hoặc vượt qua các biện pháp bảo mật.',
            'Thu thập tự động (crawl, scrape) dữ liệu, sao chép nội dung của VietGo để sử dụng cho mục đích thương mại khi chưa được cho phép.',
            'Dùng trợ lý AI để tạo nội dung vi phạm pháp luật hoặc lạm dụng tính năng quét hóa đơn với giấy tờ không thuộc quyền của bạn.'
          ]
        }
      ]
    },
    {
      id: 'so-huu-tri-tue',
      heading: '9. Quyền sở hữu trí tuệ',
      blocks: [
        'Tên, logo "vietgo", giao diện, mã nguồn, cơ sở dữ liệu tổng hợp và nội dung do VietGo biên soạn thuộc quyền sở hữu của VietGo hoặc được cấp phép hợp pháp.',
        'Một số nội dung thuộc sở hữu của bên thứ ba và được sử dụng theo giấy phép tương ứng, bao gồm: hình ảnh từ Unsplash; bản đồ từ OpenStreetMap và Esri; dữ liệu địa điểm từ Google Maps Platform và Foursquare.',
        'Nội dung bạn tạo (ghi chú, lịch trình, khoản chi, ảnh hóa đơn) thuộc về bạn. Bạn cấp cho VietGo quyền sử dụng không độc quyền, miễn phí đối với nội dung đó chỉ trong phạm vi cần thiết để vận hành và cung cấp Dịch vụ cho chính bạn.'
      ]
    },
    {
      id: 'trach-nhiem',
      heading: '10. Giới hạn trách nhiệm',
      blocks: [
        'Dịch vụ được cung cấp theo hiện trạng và khả năng sẵn có. Trong phạm vi pháp luật cho phép, VietGo không chịu trách nhiệm đối với:',
        {
          type: 'list',
          items: [
            'Thiệt hại phát sinh từ việc bạn dựa hoàn toàn vào thông tin tham khảo, nội dung do AI tạo ra mà không kiểm chứng.',
            'Chất lượng, giá cả, việc thực hiện hoặc hủy dịch vụ của Nhà cung cấp.',
            'Gián đoạn do sự cố của nhà mạng, bên thứ ba (Google, Foursquare...), thiên tai, hoặc sự kiện bất khả kháng.',
            'Mất dữ liệu lưu trên thiết bị của bạn (danh sách yêu thích, chi tiêu...) khi bạn xóa dữ liệu trình duyệt hoặc đổi thiết bị.'
          ]
        },
        'Điều khoản này không loại trừ trách nhiệm của VietGo trong những trường hợp pháp luật không cho phép loại trừ, bao gồm các quyền của bạn theo Luật Bảo vệ quyền lợi người tiêu dùng.'
      ]
    },
    {
      id: 'cham-dut',
      heading: '11. Tạm ngưng và chấm dứt',
      blocks: [
        `Bạn có thể ngừng sử dụng Dịch vụ bất kỳ lúc nào và yêu cầu xóa tài khoản qua ${supportEmail}.`,
        'VietGo có quyền tạm khóa hoặc chấm dứt tài khoản vi phạm Điều khoản này, có dấu hiệu gian lận, bị xâm nhập, hoặc theo yêu cầu của cơ quan nhà nước có thẩm quyền. Trừ trường hợp khẩn cấp hoặc pháp luật cấm, chúng tôi sẽ thông báo lý do cho bạn.'
      ]
    },
    {
      id: 'thay-doi',
      heading: '12. Thay đổi Điều khoản',
      blocks: [
        'VietGo có thể cập nhật Điều khoản để phù hợp với thay đổi của Dịch vụ hoặc pháp luật. Phiên bản mới sẽ được đăng trong ứng dụng kèm ngày hiệu lực. Với thay đổi quan trọng, chúng tôi sẽ thông báo trước ít nhất 07 ngày. Việc bạn tiếp tục sử dụng sau ngày hiệu lực đồng nghĩa với việc chấp nhận Điều khoản mới.'
      ]
    },
    {
      id: 'luat-ap-dung',
      heading: '13. Luật áp dụng và giải quyết tranh chấp',
      blocks: [
        'Điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Tranh chấp phát sinh trước hết được giải quyết bằng thương lượng, hòa giải. Nếu không đạt được thỏa thuận trong 30 ngày, một trong hai bên có quyền đưa tranh chấp ra Tòa án có thẩm quyền tại Việt Nam.',
        'Người tiêu dùng có quyền khiếu nại, yêu cầu hỗ trợ tại cơ quan quản lý nhà nước về bảo vệ quyền lợi người tiêu dùng theo quy định.'
      ]
    },
    {
      id: 'lien-he',
      heading: '14. Liên hệ',
      blocks: [
        {
          type: 'list',
          items: [
            `Đơn vị vận hành: ${companyName}`,
            `Địa chỉ: ${address}`,
            `Email hỗ trợ: ${supportEmail}`,
            `Hotline: ${hotline}`
          ]
        }
      ]
    }
  ]
};

// ============================================================================
// CHÍNH SÁCH QUYỀN RIÊNG TƯ
// ============================================================================

export const PRIVACY_POLICY: LegalDocument = {
  id: 'privacy',
  title: 'Chính sách quyền riêng tư',
  summary:
    'VietGo thu thập dữ liệu gì, dùng vào việc gì, chia sẻ với ai, lưu ở đâu và bạn có những quyền gì đối với dữ liệu của mình.',
  sections: [
    {
      id: 'tom-tat',
      heading: 'Tóm tắt nhanh',
      blocks: [
        {
          type: 'list',
          items: [
            'VietGo không bán dữ liệu cá nhân của bạn và không dùng dữ liệu cho quảng cáo của bên thứ ba.',
            'Vị trí chỉ được lấy khi bạn chủ động bấm "Xác định vị trí" và không được lưu lại.',
            'Thông tin dị ứng, chế độ ăn là dữ liệu nhạy cảm — chỉ thu thập khi bạn tự chọn và có thể xóa bất kỳ lúc nào.',
            'Đăng nhập Google chỉ lấy họ tên, Gmail và ảnh đại diện — VietGo không đọc được thư, Drive hay danh bạ của bạn.',
            'Nội dung chat AI và ảnh hóa đơn được gửi tới Google Gemini để xử lý.'
          ]
        }
      ]
    },
    {
      id: 'pham-vi',
      heading: '1. Phạm vi và bên kiểm soát dữ liệu',
      blocks: [
        `Chính sách này áp dụng cho dữ liệu cá nhân được xử lý khi bạn sử dụng VietGo. ${companyName} ("VietGo", "chúng tôi") là bên kiểm soát và xử lý dữ liệu cá nhân của bạn.`,
        'Chính sách được xây dựng theo Luật Bảo vệ dữ liệu cá nhân năm 2025 và các văn bản hướng dẫn thi hành, Luật An ninh mạng, Luật Giao dịch điện tử và Luật Bảo vệ quyền lợi người tiêu dùng.'
      ]
    },
    {
      id: 'du-lieu-thu-thap',
      heading: '2. Dữ liệu chúng tôi thu thập',
      blocks: [
        {
          type: 'table',
          head: ['Nhóm dữ liệu', 'Chi tiết', 'Khi nào'],
          rows: [
            ['Tài khoản', 'Tên đăng nhập, họ và tên, mật khẩu (chỉ lưu dạng đã mã hóa một chiều), trạng thái xác minh', 'Khi bạn đăng ký'],
            ['Liên hệ', 'Gmail, số điện thoại (không bắt buộc)', 'Khi bạn đăng ký hoặc thêm trong Hồ sơ'],
            ['Tài khoản Google', 'Họ tên, Gmail, ảnh đại diện, mã định danh tài khoản Google', 'Khi bạn đăng nhập/liên kết bằng Google'],
            ['Travel DNA', 'Phong cách du lịch, nhịp độ chuyến đi, tỉnh thành đã đến, sở thích ăn uống', 'Khi bạn tự chọn trong Hồ sơ'],
            ['Sức khỏe (nhạy cảm)', 'Dị ứng thực phẩm (vd: đậu phộng), chế độ ăn chay', 'Chỉ khi bạn tự chọn'],
            ['Vị trí', 'Tọa độ GPS gần đúng của thiết bị', 'Chỉ khi bạn bấm xác định vị trí ở trang "Xung quanh"'],
            ['Nội dung AI', 'Tin nhắn chat, yêu cầu lập/chỉnh sửa lịch trình, điểm đến, ngân sách, số người đi', 'Khi bạn dùng Trợ lý AI'],
            ['Ảnh hóa đơn', 'Hình ảnh hóa đơn và thông tin trích xuất (tên cửa hàng, số tiền, ngày)', 'Khi bạn dùng tính năng quét hóa đơn'],
            ['Chi tiêu & yêu thích', 'Chuyến đi, ngân sách, khoản chi, địa điểm đã lưu', 'Khi bạn sử dụng các tính năng này'],
            ['Đặt chỗ', 'Họ tên, số điện thoại, ngày giờ, số khách, ghi chú', 'Khi bạn gửi yêu cầu đặt bàn/vé'],
            ['Kỹ thuật', 'Địa chỉ IP, loại trình duyệt, thiết bị, thời gian truy cập, nhật ký lỗi', 'Tự động khi bạn truy cập']
          ]
        },
        'VietGo không yêu cầu và không cố ý thu thập số CCCD/hộ chiếu, thông tin thẻ thanh toán, dữ liệu sinh trắc học hay danh bạ của bạn.'
      ]
    },
    {
      id: 'muc-dich',
      heading: '3. Mục đích xử lý',
      blocks: [
        {
          type: 'list',
          items: [
            'Tạo, xác thực và bảo vệ tài khoản: đăng nhập, gửi mã OTP, khôi phục mật khẩu, phát hiện đăng nhập bất thường.',
            'Cá nhân hóa gợi ý: dùng Travel DNA để đề xuất điểm đến, món ăn và lịch trình phù hợp; tránh gợi ý món có thành phần bạn dị ứng.',
            'Cung cấp tính năng: tìm địa điểm xung quanh, trả lời câu hỏi, lập lịch trình, trích xuất hóa đơn, quản lý chi tiêu.',
            'Chuyển yêu cầu đặt chỗ tới Nhà cung cấp và hỗ trợ khi có sự cố.',
            'Chăm sóc khách hàng, gửi thông báo liên quan đến tài khoản và thay đổi chính sách.',
            'Bảo đảm an ninh, phòng chống gian lận, khắc phục lỗi và cải thiện chất lượng Dịch vụ.',
            'Tuân thủ nghĩa vụ pháp lý và yêu cầu hợp pháp của cơ quan nhà nước có thẩm quyền.'
          ]
        },
        'VietGo không sử dụng dữ liệu của bạn cho mục đích khác với các mục đích trên khi chưa có sự đồng ý của bạn.'
      ]
    },
    {
      id: 'co-so',
      heading: '4. Cơ sở xử lý và sự đồng ý',
      blocks: [
        {
          type: 'list',
          items: [
            'Sự đồng ý của bạn: khi bạn tích chọn đồng ý lúc đăng ký, cấp quyền vị trí, chọn thông tin dị ứng/chế độ ăn hoặc liên kết Google. Với dữ liệu nhạy cảm, chúng tôi chỉ xử lý khi bạn chủ động cung cấp.',
            'Thực hiện hợp đồng: xử lý cần thiết để cung cấp Dịch vụ bạn yêu cầu (vd: chuyển yêu cầu đặt chỗ).',
            'Nghĩa vụ pháp lý: lưu trữ, cung cấp dữ liệu theo yêu cầu của pháp luật.',
            'Tình huống khẩn cấp: bảo vệ tính mạng, sức khỏe của bạn hoặc người khác.'
          ]
        },
        'Bạn có thể rút lại sự đồng ý bất kỳ lúc nào (vd: tắt quyền vị trí trong trình duyệt, bỏ chọn thông tin dị ứng, hủy liên kết Google). Việc rút lại không ảnh hưởng đến tính hợp pháp của việc xử lý trước đó, nhưng một số tính năng có thể không hoạt động.'
      ]
    },
    {
      id: 'chia-se',
      heading: '5. Chia sẻ dữ liệu với bên thứ ba',
      blocks: [
        'VietGo chỉ chia sẻ dữ liệu ở mức tối thiểu cần thiết với các đối tác sau:',
        {
          type: 'table',
          head: ['Bên nhận', 'Dữ liệu', 'Mục đích'],
          rows: [
            ['Google — Đăng nhập bằng Google', 'Mã xác thực đăng nhập (ID token)', 'Xác minh danh tính khi bạn chọn đăng nhập bằng Google'],
            ['Google — Gemini API', 'Tin nhắn chat, yêu cầu lịch trình, ảnh hóa đơn', 'Tạo câu trả lời, lịch trình và trích xuất hóa đơn bằng AI'],
            ['Google Maps Platform, Foursquare', 'Tọa độ tìm kiếm, từ khóa, mã địa điểm', 'Tìm địa điểm xung quanh và thông tin chi tiết'],
            ['OpenStreetMap, Esri (ArcGIS)', 'Địa chỉ IP, vùng bản đồ đang xem', 'Hiển thị bản đồ nền'],
            ['Unsplash, Google Fonts, unpkg', 'Địa chỉ IP, thông tin trình duyệt', 'Tải hình ảnh, phông chữ, thư viện bản đồ'],
            ['Cloudflare (khi dùng)', 'Địa chỉ IP, dữ liệu truy cập', 'Truyền tải an toàn, chống tấn công'],
            ['Nhà cung cấp (nhà hàng, ban tổ chức...)', 'Họ tên, SĐT, số khách, thời gian, ghi chú', 'Xác nhận và phục vụ yêu cầu đặt chỗ của bạn'],
            ['Cơ quan nhà nước có thẩm quyền', 'Theo yêu cầu cụ thể', 'Khi pháp luật yêu cầu']
          ]
        },
        'Các bên thứ ba xử lý dữ liệu theo chính sách riêng của họ (ví dụ: Chính sách quyền riêng tư của Google tại policies.google.com/privacy). VietGo không bán, cho thuê hay trao đổi dữ liệu cá nhân của bạn.'
      ]
    },
    {
      id: 'luu-tru',
      heading: '6. Nơi lưu trữ và chuyển dữ liệu ra nước ngoài',
      blocks: [
        'Ở phiên bản hiện tại, phần lớn dữ liệu được lưu ngay trên trình duyệt của bạn (bộ nhớ cục bộ — localStorage), gồm: thông tin tài khoản, danh sách yêu thích, chuyến đi và khoản chi. Dữ liệu này không tự động đồng bộ giữa các thiết bị và sẽ mất nếu bạn xóa dữ liệu trình duyệt.',
        'Máy chủ VietGo chỉ xử lý tạm thời các yêu cầu (chat AI, quét hóa đơn, đặt chỗ, xác thực Google) để trả kết quả và không lưu lại nội dung chat hay ảnh hóa đơn sau khi xử lý xong.',
        'Một số đối tác (Google, Foursquare, Esri, Cloudflare...) đặt máy chủ ngoài lãnh thổ Việt Nam. Khi sử dụng các tính năng liên quan, dữ liệu có thể được chuyển ra nước ngoài. VietGo lựa chọn đối tác có cam kết bảo mật phù hợp và thực hiện thủ tục chuyển dữ liệu xuyên biên giới theo quy định pháp luật.',
        {
          type: 'note',
          tone: 'info',
          text: 'Khi VietGo triển khai lưu trữ tài khoản trên máy chủ, chúng tôi sẽ cập nhật chính sách này và thông báo cho bạn trước khi áp dụng.'
        }
      ]
    },
    {
      id: 'thoi-gian',
      heading: '7. Thời gian lưu trữ',
      blocks: [
        {
          type: 'table',
          head: ['Dữ liệu', 'Thời gian lưu'],
          rows: [
            ['Tài khoản, hồ sơ, Travel DNA', 'Đến khi bạn xóa tài khoản hoặc rút lại sự đồng ý'],
            ['Mã OTP', 'Tối đa 5 phút, hủy ngay sau khi dùng'],
            ['Trạng thái khóa đăng nhập', '5 phút kể từ lần nhập sai thứ 5'],
            ['Vị trí GPS', 'Không lưu — chỉ dùng cho lần tìm kiếm hiện tại'],
            ['Nội dung chat AI, ảnh hóa đơn trên máy chủ', 'Không lưu sau khi xử lý xong'],
            ['Yêu cầu đặt chỗ', 'Theo thời gian cần thiết để hoàn tất dịch vụ và giải quyết khiếu nại, hoặc theo quy định pháp luật'],
            ['Nhật ký kỹ thuật', 'Tối đa 12 tháng, trừ khi pháp luật yêu cầu lâu hơn']
          ]
        }
      ]
    },
    {
      id: 'bao-mat',
      heading: '8. Bảo mật dữ liệu',
      blocks: [
        {
          type: 'list',
          items: [
            'Mật khẩu được mã hóa một chiều (SHA-256) trước khi lưu; VietGo không thể xem mật khẩu của bạn.',
            'Mã OTP 6 số có hiệu lực ngắn và chỉ dùng được một lần.',
            'Tạm khóa đăng nhập sau nhiều lần nhập sai mật khẩu để chống dò mật khẩu.',
            'Mã đăng nhập Google được máy chủ kiểm tra trực tiếp với Google (chữ ký, thời hạn, ứng dụng được cấp) trước khi chấp nhận.',
            'Chống chiếm đoạt tài khoản: không tự động liên kết Google với tài khoản có email chưa xác minh.',
            'Dữ liệu truyền giữa thiết bị và máy chủ được mã hóa qua HTTPS khi truy cập bằng tên miền chính thức.'
          ]
        },
        'Không có hệ thống nào an toàn tuyệt đối. Bạn nên dùng mật khẩu mạnh, không dùng chung mật khẩu với dịch vụ khác, đăng xuất trên thiết bị dùng chung và xác minh Gmail/SĐT để khôi phục tài khoản.',
        'Nếu xảy ra sự cố lộ lọt dữ liệu, VietGo sẽ thông báo cho cơ quan chức năng và cho bạn theo thời hạn pháp luật quy định, kèm các biện pháp khắc phục.'
      ]
    },
    {
      id: 'quyen',
      heading: '9. Quyền của bạn',
      blocks: [
        'Theo pháp luật về bảo vệ dữ liệu cá nhân, bạn có quyền:',
        {
          type: 'list',
          items: [
            'Được biết về hoạt động xử lý dữ liệu của mình.',
            'Đồng ý hoặc không đồng ý, và rút lại sự đồng ý.',
            'Truy cập, xem, chỉnh sửa dữ liệu — phần lớn có thể tự thực hiện trong Hồ sơ cá nhân.',
            'Yêu cầu xóa dữ liệu hoặc xóa tài khoản.',
            'Yêu cầu hạn chế xử lý, phản đối xử lý dữ liệu.',
            'Yêu cầu cung cấp bản sao dữ liệu của mình.',
            'Khiếu nại, tố cáo, khởi kiện và yêu cầu bồi thường thiệt hại theo quy định.'
          ]
        },
        `Gửi yêu cầu tới ${privacyEmail} kèm tên đăng nhập. Để bảo vệ bạn, chúng tôi có thể xác minh danh tính (vd: gửi OTP tới Gmail/SĐT đã xác minh) trước khi xử lý. VietGo phản hồi trong thời hạn pháp luật quy định.`,
        'Bạn cũng có thể tự xóa dữ liệu lưu trên thiết bị bằng cách đăng xuất và xóa dữ liệu trang web trong cài đặt trình duyệt.'
      ]
    },
    {
      id: 'luu-tru-thiet-bi',
      heading: '10. Bộ nhớ trình duyệt và cookie',
      blocks: [
        'VietGo không dùng cookie quảng cáo hay công cụ theo dõi của bên thứ ba. Ứng dụng sử dụng bộ nhớ cục bộ của trình duyệt để hoạt động:',
        {
          type: 'table',
          head: ['Khóa lưu trữ', 'Nội dung'],
          rows: [
            ['vietgo_user', 'Phiên đăng nhập hiện tại'],
            ['vietgo_accounts', 'Thông tin tài khoản trên thiết bị này'],
            ['vietgo_wishlist', 'Danh sách địa điểm yêu thích'],
            [
              'vietgo_budget_trips, vietgo_budget_expenses, vietgo_current_trip_id',
              'Chuyến đi và khoản chi (ảnh hóa đơn được nén trước khi lưu). Mỗi tài khoản có bộ khóa riêng (hậu tố __<mã tài khoản>) nên người dùng khác trên cùng thiết bị không xem được sổ chi tiêu của bạn'
            ]
          ]
        },
        'Khi bạn dùng "Đăng nhập bằng Google", Google có thể đặt cookie riêng để vận hành tính năng đăng nhập theo chính sách của Google.'
      ]
    },
    {
      id: 'tre-em',
      heading: '11. Dữ liệu của trẻ em',
      blocks: [
        'Dịch vụ không hướng tới trẻ em dưới 16 tuổi. Việc xử lý dữ liệu của trẻ em chỉ được thực hiện khi có sự đồng ý của cha, mẹ hoặc người giám hộ. Nếu bạn là phụ huynh và phát hiện con mình đã cung cấp dữ liệu mà không có sự đồng ý, vui lòng liên hệ để chúng tôi xóa dữ liệu.'
      ]
    },
    {
      id: 'thay-doi-chinh-sach',
      heading: '12. Thay đổi chính sách',
      blocks: [
        'Chúng tôi có thể cập nhật chính sách này khi thay đổi tính năng, đối tác hoặc quy định pháp luật. Phiên bản mới sẽ ghi rõ ngày hiệu lực. Với thay đổi làm mở rộng mục đích xử lý hoặc loại dữ liệu thu thập, VietGo sẽ xin lại sự đồng ý của bạn.'
      ]
    },
    {
      id: 'lien-he-dlcn',
      heading: '13. Liên hệ về dữ liệu cá nhân',
      blocks: [
        {
          type: 'list',
          items: [
            `Bộ phận bảo vệ dữ liệu cá nhân — ${companyName}`,
            `Địa chỉ: ${address}`,
            `Email: ${privacyEmail}`,
            `Hotline: ${hotline}`
          ]
        }
      ]
    }
  ]
};

export const LEGAL_DOCUMENTS = { terms: TERMS_OF_SERVICE, privacy: PRIVACY_POLICY };
