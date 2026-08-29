using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DentaloreChat.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddAudioFieldsToMessage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AudioDuration",
                table: "Messages",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "AudioSize",
                table: "Messages",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AudioUrl",
                table: "Messages",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Messages",
                keyColumn: "Id",
                keyValue: new Guid("b1010101-0000-0000-0000-000000000000"),
                columns: new[] { "AudioDuration", "AudioSize", "AudioUrl", "Timestamp" },
                values: new object[] { null, null, null, new DateTime(2026, 8, 29, 13, 27, 45, 69, DateTimeKind.Utc).AddTicks(7914) });

            migrationBuilder.UpdateData(
                table: "Messages",
                keyColumn: "Id",
                keyValue: new Guid("b1111111-1111-1111-1111-111111111111"),
                columns: new[] { "AudioDuration", "AudioSize", "AudioUrl", "Timestamp" },
                values: new object[] { null, null, null, new DateTime(2026, 8, 29, 13, 19, 45, 69, DateTimeKind.Utc).AddTicks(7896) });

            migrationBuilder.UpdateData(
                table: "Messages",
                keyColumn: "Id",
                keyValue: new Guid("b2010201-0000-0000-0000-000000000000"),
                columns: new[] { "AudioDuration", "AudioSize", "AudioUrl", "Timestamp" },
                values: new object[] { null, null, null, new DateTime(2026, 8, 29, 13, 19, 45, 69, DateTimeKind.Utc).AddTicks(7916) });

            migrationBuilder.UpdateData(
                table: "Messages",
                keyColumn: "Id",
                keyValue: new Guid("b2222222-2222-2222-2222-222222222222"),
                columns: new[] { "AudioDuration", "AudioSize", "AudioUrl", "Timestamp" },
                values: new object[] { null, null, null, new DateTime(2026, 8, 29, 13, 24, 45, 69, DateTimeKind.Utc).AddTicks(7907) });

            migrationBuilder.UpdateData(
                table: "Messages",
                keyColumn: "Id",
                keyValue: new Guid("b7777777-7777-7777-7777-777777777777"),
                columns: new[] { "AudioDuration", "AudioSize", "AudioUrl", "Timestamp" },
                values: new object[] { null, null, null, new DateTime(2026, 8, 29, 13, 4, 45, 69, DateTimeKind.Utc).AddTicks(7909) });

            migrationBuilder.UpdateData(
                table: "Messages",
                keyColumn: "Id",
                keyValue: new Guid("b8888888-8888-8888-8888-888888888888"),
                columns: new[] { "AudioDuration", "AudioSize", "AudioUrl", "Timestamp" },
                values: new object[] { null, null, null, new DateTime(2026, 8, 29, 13, 9, 45, 69, DateTimeKind.Utc).AddTicks(7911) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AudioDuration",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "AudioSize",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "AudioUrl",
                table: "Messages");

            migrationBuilder.UpdateData(
                table: "Messages",
                keyColumn: "Id",
                keyValue: new Guid("b1010101-0000-0000-0000-000000000000"),
                column: "Timestamp",
                value: new DateTime(2026, 8, 20, 13, 6, 42, 170, DateTimeKind.Utc).AddTicks(4423));

            migrationBuilder.UpdateData(
                table: "Messages",
                keyColumn: "Id",
                keyValue: new Guid("b1111111-1111-1111-1111-111111111111"),
                column: "Timestamp",
                value: new DateTime(2026, 8, 20, 12, 58, 42, 170, DateTimeKind.Utc).AddTicks(4397));

            migrationBuilder.UpdateData(
                table: "Messages",
                keyColumn: "Id",
                keyValue: new Guid("b2010201-0000-0000-0000-000000000000"),
                column: "Timestamp",
                value: new DateTime(2026, 8, 20, 12, 58, 42, 170, DateTimeKind.Utc).AddTicks(4427));

            migrationBuilder.UpdateData(
                table: "Messages",
                keyColumn: "Id",
                keyValue: new Guid("b2222222-2222-2222-2222-222222222222"),
                column: "Timestamp",
                value: new DateTime(2026, 8, 20, 13, 3, 42, 170, DateTimeKind.Utc).AddTicks(4408));

            migrationBuilder.UpdateData(
                table: "Messages",
                keyColumn: "Id",
                keyValue: new Guid("b7777777-7777-7777-7777-777777777777"),
                column: "Timestamp",
                value: new DateTime(2026, 8, 20, 12, 43, 42, 170, DateTimeKind.Utc).AddTicks(4412));

            migrationBuilder.UpdateData(
                table: "Messages",
                keyColumn: "Id",
                keyValue: new Guid("b8888888-8888-8888-8888-888888888888"),
                column: "Timestamp",
                value: new DateTime(2026, 8, 20, 12, 48, 42, 170, DateTimeKind.Utc).AddTicks(4419));
        }
    }
}
